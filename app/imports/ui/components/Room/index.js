/* global location document window URL */
import { Meteor } from 'meteor/meteor';
import { Presence } from 'phoenix';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import update from 'immutability-helper';
import _ from 'lodash';
import Peer from 'simple-peer/simplepeer.min.js';

import hark from 'hark';
import { SPEAKING, SPEAKING_STOPPED } from 'imports/ui/actions/stream';


import mediaPreferences from 'imports/modules/media/storage';
import mediaUtils from 'imports/modules/media/utils';
import browserUtils from 'imports/modules/browser/utils';
import ActivityListener from 'imports/modules/ActivityListener';
import roomMessageTypes from 'imports/modules/room/messageTypes';
import BeamClient from 'imports/modules/BeamClient';
import sessionUtils from 'imports/modules/room/sessionUtils';
import MessageSwitch from 'imports/modules/MessageSwitch';

import { Intent } from '@blueprintjs/core';

import mapDispatchToProps from './dispatch';
// TODO: move stream handling related functions to streamManager.js

// constants
import uiConfig from './constants/uiConfig';
import status from './constants/status';
import roomActivities from './constants/roomActivities';
import messageType from './constants/messageType';

// room components
import StreamsContainer from './StreamsContainer/';
import Spotlight from './Spotlight';

import RoomAPI from './RoomAPI';
import StreamManager from './StreamManager';


import './room.scss';

const { defaultMaxVideoBW, defaultMaxAudioBW, beamConfig } = Meteor.settings.public;

class Room extends Component {
  constructor(props) {
    super(props);
    this.setupSession();
    this.erizoToken = props.roomStorage.getErizoToken();

    this.tabMessageHandlers = {}; // tabId -> messageHandler map
    this.peers = {}; // sessionId -> Peer

    this.streams = {}; // streamId -> mediaStream
    // note: erizoStream.stream would be of type MediaStream(the browser's MediaStream object)

    this.speechTrackers = {}; // streamId -> hark instance

    // Event emitter for activities in the room, such as user entering, leaving etc.
    this.activityListener = new ActivityListener(roomActivities);

    this.streamManager = new StreamManager(this);

    // Forms the interface to interact with the room. To be passed down to tabs.
    this.roomAPI = new RoomAPI(this);

    this.messageHandler = this.createMessageHandler();
    this.onWindowResize = _.throttle(this.onWindowResize, 100);

    // not all of these need to be bound, doing so anyway as I
    // often end up moving them around and getting stuck with the same error for a while.
    this.calculateUISize = this.calculateUISize.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    this.updateState = this.updateState.bind(this);
    this.connect = this.connect.bind(this);
    this.connectUser = this.connectUser.bind(this);
    this.disconnectUser = this.disconnectUser.bind(this);
    this.determineStreamContainerSize = this.determineStreamContainerSize.bind(this);
    this.setCustomStreamContainerSize = this.setCustomStreamContainerSize.bind(this);
    this.toggleFullscreen = this.toggleFullscreen.bind(this);
    this.stopScreenSharingStream = this.stopScreenSharingStream.bind(this);
    this.createPeer = this.createPeer.bind(this);

    this.state = {
      roomConnectionStatus: status.INITIALIZING,
      presence: {},
      connectedUsers: [],
      primaryMediaStreamState: {
        video: true,
        audio: true,
        mutedAudio: false,
        mutedVideo: false,
        status: status.DISCONNECTED,
      },
      screenSharingStreamState: {
        status: status.DISCONNECTED,
      },

      customStreamContainerSize: false,

      uiSize: this.calculateUISize(),
      roomHeight: window.innerHeight,
      roomWidth: window.innerWidth,

      settings: {
        uiBreakRatio: uiConfig.defaultBreakRatio, // For switching between LARGE and COMPACT
        uiBreakWidth: uiConfig.defaultBreakWidth,
      }, // user preferences such as room component sizes, position etc.
    };
    this.stateBuffer = this.state;
    this.unmountInProgress = false;
  }

  setupSession() {
    this.session = sessionUtils.createSession(this.props.roomUserId);
    const { sessionId } = sessionUtils.unpack(this.session);
    this.sessionId = sessionId;
  }

  updateState(changes, buffer = this.stateBuffer) {
    this.stateBuffer = update(buffer, changes);
    this.setState(this.stateBuffer);
  }

  handleTabMessage(message) {
    const callHandlers = handlerList => handlerList.forEach(h => h(message));
    message.destinationTabs.forEach(tabId => callHandlers(this.tabMessageHandlers[tabId]));
  }

  registerTabMessageHandler(tabId, handler) {
    if (!this.tabMessageHandlers[tabId]) {
      this.tabMessageHandlers[tabId] = [];
    }
    this.tabMessageHandlers[tabId].push(handler);
  }

  removeTabMessageHandler(tabId, handler) {
    if (!this.tabMessageHandlers[tabId]) {
      throw new Error('No message handlers exist');
    }
    this.tabMessageHandlers[tabId] = this.tabMessageHandlers[tabId].filter(h => h !== handler);
  }

  sendMessage(message) {
    return this.beamClient.pushMessage(message);
  }

  calculateUISize() {
    const { innerWidth, innerHeight } = window;
    let breakWidth = uiConfig.defaultBreakWidth;
    let breakRatio = uiConfig.defaultBreakRatio;

    if (this.state) { // component has initialized
      const { settings } = this.state;
      breakRatio = settings.uiBreakRatio;
      breakWidth = settings.uiBreakWidth;
    }

    if (innerWidth < breakWidth) {
      return uiConfig.COMPACT;
    }
    const ratio = innerWidth / innerHeight;
    return ratio < breakRatio ? uiConfig.COMPACT : uiConfig.LARGE;
  }

  createMessageHandler() {
    return new MessageSwitch()
      .registerHandlers({
        [messageType.ROOM_UPDATED]: () => this.props.updateRoomInfo(),
        [messageType.TAB_MESSAGE]: message => this.handleTabMessage(message),
        [messageType.TAB_READY]: ({ source, from: { session } }) => {
          this.activityListener.dispatch(roomActivities.REMOTE_TAB_READY, {
            session,
            source,
          });
        },
        [messageType.SIGNAL]: message => this.handleSignalingMessage(message),
      });
  }

  handleSignalingMessage({ from, content }) {
    const { session } = from;
    if (this.peers[session]) {
      this.peers[session].signal(content);
      return;
    }
    const peer = this.createPeer({ session, initiator: false });
    peer.signal(content);
    this.peers[session] = peer;
  }

  createPeer({ session, initiator }) {
    const peer = new Peer({ initiator });
    peer.on('signal', (data) => {
      this.sendMessage({
        type: messageType.SIGNAL,
        to: [{ session }],
        content: data,
      });
    });
    peer.on('connect', () => {
      const { userId } = sessionUtils.unpack(session);
      this.connectUser(userId, session);
    });
    return peer;
  }

  connect() {
    const handleJoin = (session) => {
      if (session === this.session) {
        const { userId } = sessionUtils.unpack(session);
        this.connectUser(userId, session);
        return;
      }
      if (this.peers[session]) {
        console.error('peer exists');
        // WIP
        // this.peers[session].destroy();
        // delete this.peers[session];
      }
      const peer = this.createPeer({ session, initiator: true });
      this.peers[session] = peer;
    };


    const handleLeave = (session) => {
      if (this.peers[session]) {
        this.peers[session].destroy();
        delete this.peers[session];
      }
      const { userId } = sessionUtils.unpack(session);
      this.disconnectUser(userId, session);
    };

    const handlePresenceState = (initialPresence) => {
      const syncedPresence = Presence.syncState(this.stateBuffer.presence, initialPresence);
      this.updateState({ presence: { $set: syncedPresence } });
      // Object.keys(initialPresence).forEach(handleJoin);
    };

    const handlePresenceDiff = (diff) => {
      console.log('presence_diff', diff);
      const oldPresence = this.stateBuffer.presence;
      const syncedPresence = Presence.syncDiff(oldPresence, diff);
      this.updateState({ presence: { $set: syncedPresence } });

      const handleJoins = joins => Object.keys(joins).forEach(handleJoin);
      const handleLeaves = leaves => Object.keys(leaves).forEach(handleLeave);
      handleJoins(diff.joins);
      handleLeaves(diff.leaves);
    };

    this.beamClient = new BeamClient(beamConfig, this.props.roomStorage.getUserToken());
    this.beamClient.joinRoomChannel({
      roomId: this.props.roomId,
      roomAccessToken: this.props.roomStorage.getAccessToken(),
      sessionId: this.sessionId,
      onJoin: () => this.updateState({ roomConnectionStatus: { $set: status.CONNECTED } }),
      onError: () => this.updateState({ roomConnectionStatus: { $set: status.TRYING_TO_CONNECT } }),
      presenceStateHandler: handlePresenceState,
      presenceDiffHandler: handlePresenceDiff,
      onMessage: this.messageHandler.handleMessage,
    });
  }

  stopScreenSharingStream() {
    this.updateState({
      screenSharingStreamState: {
        status: { $set: status.DISCONNECTED },
      },
    });
    this.screenSharingStream.close();
    this.screenSharingStream = null;
  }

  initializeScreenSharingStream() {
    if (this.screenSharingStream) {
      // unpublish and destroy
      this.screenSharingStream.close();
    }
    this.updateState({
      screenSharingStreamState: {
        status: { $set: status.TRYING_TO_CONNECT },
      },
    });

    this.screenSharingStream = Erizo.Stream({
      screen: true,
      extensionId: Meteor.settings.public.screenShareExtensionId,
      attributes: {
        userId: this.props.roomUserId,
        sessionId: this.sessionId,
        type: streamTypes.MEDIA.BROADCAST,
        purpose: mediaStreamPurpose.SCREEN_SHARE_STREAM,
      },
    });
    const mediaStream = this.screenSharingStream;
    mediaStream.addEventListener('access-accepted', () => {
      this.erizoRoom.publish(
        mediaStream,
        { maxVideoBW: defaultMaxVideoBW, maxAudioBW: defaultMaxAudioBW },
      );
      mediaStream.stream.getVideoTracks()[0].onended = this.stopScreenSharingStream;
    });
    mediaStream.addEventListener('access-denied', () => {
      this.props.toaster.show({
        message: (
          <div>
            could not access your screen for sharing 😕
            <br/>
            Note: Currently works on
            chrome, <a style={{ color: 'greenyellow' }} target="_blank" rel="noopener noreferrer" href="https://chrome.google.com/webstore/detail/oorja-screensharing/kobkjhijljmjkobadoknmhakgfpkhiff?hl=en-US"> install this extension</a>
          </div>
        ),
        intent: Intent.WARNING,
      });
      this.updateState({
        screenSharingStreamState: {
          status: { $set: status.ERROR },
        },
      });
    });
    mediaStream.addEventListener('stream-ended', this.stopScreenSharingStream);
    mediaStream.init();
  }

  formMediaStreamState({ userId, mediaStream, isLocal = false }) {
    const streamId = mediaStream.id;
    return {
      userId,
      streamId,
      local: isLocal,
      status: status.CONNECTED,
      audio: mediaUtils.hasAudio(mediaStream),
      video: mediaUtils.hasVideo(mediaStream),
      mutedAudio: mediaUtils.isAudioMuted(mediaStream),
      mutedVideo: mediaUtils.isVideoMuted(mediaStream),
      streamSource: mediaStream,
      errorReason: '',
      warningReason: '',
    };
  }

  initializePrimaryMediaStream() {
    // create a stream with saved preferences
    // if failure. delete media preferences
    navigator.mediaDevices.getUserMedia(mediaUtils.getSavedConstraints())
      .then((mediaStream) => {
        this.props.updateMediaStreams({
          [mediaStream.id]: {
            $set: this.formMediaStreamState({
              userId: this.props.roomUserId,
              mediaStream,
              isLocal: true,
            }),
          },
        });
        this.updateState({
          primaryMediaStreamState: {
            status: { $set: status.CONNECTED },
            audio: { $set: mediaUtils.hasAudio(mediaStream) },
            video: { $set: mediaUtils.hasVideo(mediaStream) },
          },
        });
      })
      .catch(() => {
        mediaPreferences.clear();
        this.props.toaster.show({
          message: 'could not access your camera or microphone 😕',
          intent: Intent.WARNING,
        });
        this.updateState({
          primaryMediaStreamState: {
            status: { $set: status.ERROR },
          },
        });
        this.primaryMediaStream = null;
      });

    // if (this.primaryMediaStream) {
    //   // unpublish and destroy
    //   const speechTracker = this.speechTrackers[this.primaryMediaStream.getID()];
    //   if (speechTracker) speechTracker.stop();
    //   this.primaryMediaStream.close();
    // }

    // this.primaryMediaStream = Erizo.Stream({
    //   audio: this.state.primaryMediaStreamState.audio,
    //   video: this.state.primaryMediaStreamState.video,
    //   videoSize: this.videoQualitySetting[mediaDeviceSettings.videoQuality],
    //   data: false,
    //   attributes: {
    //     userId: this.props.roomUserId,
    //     sessionId: this.sessionId,
    //     type: streamTypes.MEDIA.BROADCAST,
    //     purpose: mediaStreamPurpose.PRIMARY_MEDIA_STREAM,
    //     mutedAudio: mediaDeviceSettings.mutedAudio,
    //     mutedVideo: mediaDeviceSettings.mutedVideo,
    //   },
    // });
    // const mediaStream = this.primaryMediaStream;
    // mediaStream.addEventListener('access-accepted', () => {
    //   this.updateState({
    //     primaryMediaStreamState: {
    //       status: { $set: status.TRYING_TO_CONNECT },
    //       audio: { $set: this.primaryMediaStream.stream.getAudioTracks().length > 0 },
    //       video: { $set: this.primaryMediaStream.stream.getVideoTracks().length > 0 },
    //     },
    //   });
    //   this.streamManager.muteBeforePublish(mediaStream, mediaDeviceSettings);
    //   this.erizoRoom.publish(
    //     mediaStream,
    //     { maxVideoBW: defaultMaxVideoBW, maxAudioBW: defaultMaxAudioBW },
    //   );
    // });
    // mediaStream.addEventListener('access-denied', () => {

    // });
    // mediaStream.addEventListener('stream-ended', (streamEvent) => {
    //   console.info(streamEvent);
    // });
    // mediaStream.init();
  }

  connectUser(userId, session) {
    // adds user to connectedUsers list in state, increments sessionCount if already there.
    const connectedUser = _.find(this.stateBuffer.connectedUsers, { userId });

    if (!connectedUser) {
      this.activityListener.dispatch(roomActivities.USER_JOINED, { userId, session });
      this.updateState({
        connectedUsers: { $push: [{ userId, sessionCount: 1, sessionList: [session] }] },
      });
      return;
    }

    const connectedUserIndex = _.findIndex(
      this.stateBuffer.connectedUsers,
      { userId: connectedUser.userId },
    );

    const updatedUser = update(
      connectedUser,
      {
        sessionCount: { $set: connectedUser.sessionCount + 1 },
        sessionList: { $push: [session] },
      },
    );
    this.activityListener.dispatch(roomActivities.USER_SESSION_ADDED, { userId, session });
    this.updateState({
      connectedUsers: { $splice: [[connectedUserIndex, 1, updatedUser]] },
    });
    console.info('incremented session');
  }

  // decrements sessionCount for user. removing from connectUsers if reaches 0.
  disconnectUser(userId, session) {
    const connectedUserIndex = _.findIndex(this.stateBuffer.connectedUsers, { userId });

    if (connectedUserIndex === -1) return;

    const connectedUser = this.stateBuffer.connectedUsers[connectedUserIndex];
    if (!connectedUser.sessionList.find(s => s === session)) return;
    if (connectedUser.sessionCount > 1) {
      const updatedUser = update(
        connectedUser,
        {
          sessionCount: { $set: connectedUser.sessionCount - 1 },
          sessionList: { $set: connectedUser.sessionList.filter(s => s !== session) },
        },
      );

      this.activityListener.dispatch(roomActivities.USER_SESSION_REMOVED, { userId, session });
      this.updateState({
        connectedUsers: { $splice: [[connectedUserIndex, 1, updatedUser]] },
      });
      console.info('decremented user session', updatedUser);
      return;
    }

    this.activityListener.dispatch(roomActivities.USER_LEFT, { userId, session });
    this.updateState({
      connectedUsers: {
        $splice: [[connectedUserIndex, 1]],
      },
    });
  }

  messageHandleasdr(message) {
    const {
      SPEECH, MUTE_AUDIO, UNMUTE_AUDIO,
      MUTE_VIDEO, UNMUTE_VIDEO,
    } = roomMessageTypes;
    const roomMessage = message.content;
    const handleSpeechMessage = () => {
      const eventDetail = roomMessage.content;
      const { streamId } = eventDetail;
      switch (eventDetail.action) {
        case SPEAKING:
          if (this.props.mediaStreams[streamId]) {
            this.activityListener
              .dispatch(roomActivities.STREAM_SPEAKING_START, { streamId, remote: true });
            this.props.streamSpeaking(streamId);
          }
          break;
        case SPEAKING_STOPPED:
          if (this.props.mediaStreams[streamId]) {
            this.activityListener
              .dispatch(roomActivities.STREAM_SPEAKING_END, { streamId, remote: true });
            this.props.streamSpeakingStopped(streamId);
          }
          break;
        default: console.error('unrecognised speech status');
      }
    };

    switch (roomMessage.type) {
      case SPEECH: handleSpeechMessage();
        break;
      default: console.error('unrecognised room message');
    }
  }

  // to be used with media streams
  // only use for local streams and broadcast the speech events over data stream.
  addSpeechTracker(stream) {
    if (!stream.hasAudio()) console.error('stream has no audio');
    const tracker = hark(stream.stream); // the browser mediaStream object
    const streamId = stream.getID();
    const broadcastSpeechEvent = (action) => {
      this.roomAPI.sendMessage({
        broadcast: true,
        type: messageType.ROOM_MESSAGE,
        content: {
          type: roomMessageTypes.SPEECH,
          content: {
            action,
            streamId,
          },
        },
      });
    };
    tracker.on('speaking', () => {
      this.props.streamSpeaking(streamId);
      this.activityListener
        .dispatch(roomActivities.STREAM_SPEAKING_START, { streamId, remote: false });
      if (this.state.roomConnectionStatus !== status.CONNECTED) return;
      broadcastSpeechEvent(SPEAKING);
    });

    tracker.on('stopped_speaking', () => {
      this.props.streamSpeakingStopped(streamId);
      this.activityListener
        .dispatch(roomActivities.STREAM_SPEAKING_END, { streamId, remote: false });
      if (this.state.roomConnectionStatus !== status.CONNECTED) return;
      broadcastSpeechEvent(SPEAKING_STOPPED);
    });
    this.speechTrackers[stream.getID()] = tracker;
  }

  removeSpeechTracker(stream) {
    const speechTracker = this.speechTrackers[stream.getID()];
    if (speechTracker) speechTracker.stop();
  }

  onWindowResize(event) {
    const { innerHeight, innerWidth } = event.target.window;
    this.updateState({
      uiSize: { $set: this.calculateUISize() },
      roomWidth: { $set: innerWidth },
      roomHeight: { $set: innerHeight },
    });
  }

  componentWillMount() {
    window.addEventListener('resize', this.onWindowResize);
  }

  componentDidMount() {
    // store body bg color and then change it.
    this.connect();
    this.initializePrimaryMediaStream();
    this.originalBodyBackground = browserUtils.getBodyColor();
    browserUtils.setBodyColor('#2e3136');
  }

  componentWillUnmount() {
    this.unmountInProgress = true;
    // if (this.primaryMediaStream) {
    //   this.removeSpeechTracker(this.primaryMediaStream);
    //   this.primaryMediaStream.stop();
    // }
    // this.erizoRoom.disconnect();
    this.beamClient.leaveRoomChannel();
    window.removeEventListener('resize', this.onWindowResize);

    // restore original body bg color
    browserUtils.setBodyColor(this.originalBodyBackground);
  }

  determineStreamContainerSize() {
    const { mediaStreams } = this.props;
    if (!mediaStreams) return uiConfig.COMPACT;
    const atleastOneVideoStream = Object.keys(mediaStreams)
      .map(streamId => mediaStreams[streamId])
      .some(stream =>
        stream.video && !stream.mutedVideo && (stream.status !== status.TRYING_TO_CONNECT));
    return atleastOneVideoStream ? uiConfig.MEDIUM : uiConfig.COMPACT;
  }

  setCustomStreamContainerSize(size) {
    this.updateState({
      customStreamContainerSize: {
        $set: size ? uiConfig[size] : false,
      },
    });
  }

  toggleFullscreen() {
    const element = this.roomDiv;
    browserUtils.toggleFullScreenForElement(element);
  }

  render() {
    const { uiSize, customStreamContainerSize } = this.state;
    const streamContainerSize = customStreamContainerSize || this.determineStreamContainerSize();
    return (
      <div className='room page' ref={ (div) => { this.roomDiv = div; } }>
        <div className="fullscreenButton" onClick={this.toggleFullscreen}>
          <i className="icon ion-android-expand"></i>
        </div>
        <StreamsContainer
          uiSize={uiSize}
          streamContainerSize={streamContainerSize}
          roomInfo={this.props.roomInfo}
          roomAPI={this.roomAPI}
          dispatchRoomActivity={this.activityListener.dispatch}
          connectedUsers={this.state.connectedUsers}/>
        <Spotlight
          roomReady={this.state.roomConnectionStatus === status.CONNECTED }
          roomInfo={this.props.roomInfo}
          roomStorage={this.props.roomStorage}
          connectedUsers={this.state.connectedUsers}
          roomAPI={this.roomAPI}
          oorjaClient={this.props.oorjaClient}
          dispatchRoomActivity={this.activityListener.dispatch}
          primaryMediaStreamState={this.state.primaryMediaStreamState}
          screenSharingStreamState={this.state.screenSharingStreamState}
          uiSize={uiSize}
          streamContainerSize={streamContainerSize}
          setCustomStreamContainerSize={this.setCustomStreamContainerSize}/>
      </div>
    );
  }
}

Room.propTypes = {
  roomId: PropTypes.string.isRequired,
  roomInfo: PropTypes.object.isRequired,
  updateRoomInfo: PropTypes.func.isRequired,
  roomUserId: PropTypes.string.isRequired,
  roomStorage: PropTypes.object.isRequired,
  oorjaClient: PropTypes.object.isRequired,
  toaster: PropTypes.object.isRequired,
  mediaStreams: PropTypes.object.isRequired,
  resetMediaStreams: PropTypes.func.isRequired,
  updateMediaStreams: PropTypes.func.isRequired,
  streamSpeaking: PropTypes.func.isRequired,
  streamSpeakingStopped: PropTypes.func.isRequired,
};


const mapStateToProps = state => ({
  mediaStreams: state.mediaStreams,
  focussedStreamId: state.focussedStreamId,
});

export default connect(mapStateToProps, mapDispatchToProps)(Room);

