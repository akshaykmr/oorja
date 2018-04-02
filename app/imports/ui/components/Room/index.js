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

import mediaPreferences from 'imports/modules/media/storage';
import mediaUtils from 'imports/modules/media/utils';
import browserUtils from 'imports/modules/browser/utils';
import ActivityListener from 'imports/modules/ActivityListener';
import BeamClient from 'imports/modules/BeamClient';
import sessionUtils from 'imports/modules/room/sessionUtils';
import MessageSwitch from 'imports/modules/MessageSwitch';

import { Intent } from '@blueprintjs/core';
import { Maximize as MaximizeIcon } from 'imports/ui/components/icons';

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

const { beamConfig, screenShareExtensionId } = Meteor.settings.public;

class Room extends Component {
  constructor(props) {
    super(props);
    this.setupSession();
    this.erizoToken = props.roomStorage.getErizoToken();

    this.tabMessageHandlers = {}; // tabId -> messageHandler map
    this.peers = {}; // sessionId -> Peer

    this.streams = {}; // streamId -> mediaStream
    // note: erizoStream.stream would be of type MediaStream(the browser's MediaStream object)
    this.sessionStreams = {}; // session -> [ streamId, ... ];

    this.speechTrackers = {}; // streamId -> hark instance

    // Event emitter for activities in the room, such as user entering, leaving etc.
    this.activityListener = new ActivityListener(roomActivities);

    this.streamManager = new StreamManager(this);

    // Forms the interface to interact with the room. To be passed down to tabs.
    this.roomAPI = new RoomAPI(this);

    this.primaryMediaStream = null;
    this.screenSharingStream = null;

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
    this.createPeer = this.createPeer.bind(this);
    this.handleJoin = this.handleJoin.bind(this);
    this.handleLeave = this.handleLeave.bind(this);
    this.initializeScreenSharing = this.initializeScreenSharing.bind(this);

    this.state = {
      roomConnectionStatus: status.INITIALIZING,
      presence: {},
      connectedUsers: [],
      primaryMediaStreamState: {
        video: false,
        audio: false,
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

  createMessageHandler() { // TODO: refactor. use messageSwitch to organize and break it down.
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
        [messageType.SPEAKING]: ({ content: { streamId } }) => {
          if (this.props.mediaStreams[streamId]) {
            this.activityListener
              .dispatch(roomActivities.STREAM_SPEAKING_START, { streamId, remote: true });
            this.props.streamSpeaking(streamId);
          }
        },
        [messageType.SPEAKING_STOPPED]: ({ content: { streamId } }) => {
          if (this.props.mediaStreams[streamId]) {
            this.activityListener
              .dispatch(roomActivities.STREAM_SPEAKING_END, { streamId, remote: true });
            this.props.streamSpeakingStopped(streamId);
          }
        },
        [messageType.STREAM_UPDATE]: ({ content: { streamId, mutedAudio, mutedVideo } }) => {
          if (this.props.mediaStreams[streamId]) {
            this.props.updateMediaStreams({
              [streamId]: {
                mutedAudio: { $set: mutedAudio },
                mutedVideo: { $set: mutedVideo },
              },
            });
          }
        },
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

  publishMediaStream(peer, mediaStream) {
    if (mediaStream) {
      try {
        peer.addStream(mediaStream);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  getPeerList() {
    return Object.entries(this.peers)
      .map(([_sessionId, peer]) => peer);
  }

  unpublishMediaStream(peer, mediaStream) {
    if (mediaStream) {
      try {
        peer.removeStream(mediaStream);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  createPeer({ session, initiator }) {
    const { userId } = sessionUtils.unpack(session);
    const peer = new Peer({ initiator, reconnectTimer: 200 });
    peer.on('signal', (data) => {
      this.sendMessage({
        type: messageType.SIGNAL,
        to: [{ session }],
        content: data,
      });
    });
    peer.on('stream', (mediaStream) => {
      if (!this.props.mediaStreams[mediaStream.id]) {
        this.props.updateMediaStreams({
          [mediaStream.id]: {
            $set: this.streamManager.formMediaStreamState({
              userId,
              mediaStream,
              isLocal: false,
            }),
          },
        });
        this.sessionStreams[session].push(mediaStream.id);
      }
    });
    peer.on('removestream', (mediaStream) => {
      mediaUtils.destroyMediaStream(mediaStream);
      this.props.updateMediaStreams({
        $unset: [mediaStream.id],
      });
    });
    peer.on('connect', () => {
      this.connectUser(userId, session);
      this.sessionStreams[session] = [];
      this.publishMediaStream(peer, this.primaryMediaStream);
    });
    return peer;
  }

  handleJoin(session) {
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
  }

  handleLeave(session) {
    if (this.peers[session]) {
      this.peers[session].destroy();
      delete this.peers[session];
      this.sessionStreams[session].forEach((streamId) => {
        this.props.updateMediaStreams({
          $unset: [streamId],
        });
      });
    }
    const { userId } = sessionUtils.unpack(session);
    this.disconnectUser(userId, session);
  }

  connect() {
    const handlePresenceState = (initialPresence) => {
      const syncedPresence = Presence.syncState(this.stateBuffer.presence, initialPresence);
      this.updateState({ presence: { $set: syncedPresence } });
    };

    const handlePresenceDiff = (diff) => {
      console.log('presence_diff', diff);
      const oldPresence = this.stateBuffer.presence;
      const syncedPresence = Presence.syncDiff(oldPresence, diff);
      this.updateState({ presence: { $set: syncedPresence } });

      const handleJoins = joins => Object.keys(joins).forEach(this.handleJoin);
      const handleLeaves = leaves => Object.keys(leaves).forEach(this.handleLeave);
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

  // to be only used with local mediaStreams
  cleanupMediaStream(mediaStream) {
    if (mediaStream) {
      this.getPeerList()
        .forEach(peer => this.unpublishMediaStream(peer, mediaStream));
      mediaUtils.destroyMediaStream(mediaStream);
      this.removeSpeechTracker(mediaStream.id);
    }
  }

  cleanupPrimaryMediaStream() {
    if (this.primaryMediaStream) {
      this.props.updateMediaStreams({
        $unset: [this.primaryMediaStream.id],
      });
      this.cleanupMediaStream(this.primaryMediaStream);
      this.primaryMediaStream = null;
    }
  }
  initializePrimaryMediaStream() {
    this.cleanupPrimaryMediaStream();
    // create a stream with saved preferences
    const mutedVideo = mediaPreferences.isVideoMute();
    const mutedAudio = mediaPreferences.isVoiceMute();

    this.updateState({
      primaryMediaStreamState: {
        mutedAudio: { $set: mutedAudio },
        mutedVideo: { $set: mutedVideo },
      },
    });

    const savedConstraints = mediaUtils.getSavedConstraints();
    const constraints = {};
    constraints.audio = savedConstraints.audio || true;

    if (mutedVideo && mutedAudio) return;

    if (!mutedVideo) constraints.video = savedConstraints.video;

    const onSuccess = (mediaStream) => {
      if (mutedAudio) mediaUtils.muteAudioTracks(mediaStream);
      if (mutedVideo) mediaUtils.muteVideoTracks(mediaStream);

      this.primaryMediaStream = mediaStream;
      this.props.updateMediaStreams({
        [mediaStream.id]: {
          $set: this.streamManager.formMediaStreamState({
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
      this.addSpeechTracker(mediaStream);
      this.getPeerList()
        .forEach(peer => this.publishMediaStream(peer, mediaStream));
    };

    const onFailure = () => {
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
    };

    this.updateState({
      primaryMediaStreamState: {
        status: { $set: status.INITIALIZING },
      },
    });

    navigator.mediaDevices.getUserMedia(constraints)
      .then(onSuccess, onFailure);
  }

  cleanupScreenSharingStream() {
    if (this.screenSharingStream) {
      if (!this.unmountInProgress) {
        this.props.updateMediaStreams({
          $unset: [this.screenSharingStream.id],
        });
        this.updateState({
          screenSharingStreamState: {
            status: { $set: status.DISCONNECTED },
          },
        });
      }
      this.cleanupMediaStream(this.screenSharingStream);
      this.screenSharingStream = null;
    }
  }

  initializeScreenSharing() {
    this.cleanupScreenSharingStream();

    const onSuccess = (mediaStream) => {
      /* eslint-disable no-param-reassign */
      mediaStream.getTracks().forEach((track) => {
        track.onended = () => {
          // remove callbacks for other tracks.
          mediaStream.getTracks().forEach((otherTrack) => {
            otherTrack.onended = null;
          });
          this.cleanupScreenSharingStream();
        };
      });
      /* eslint-enable no-param-reassign */
      this.screenSharingStream = mediaStream;
      this.props.updateMediaStreams({
        [mediaStream.id]: {
          $set: this.streamManager.formMediaStreamState({
            userId: this.props.roomUserId,
            mediaStream,
            isLocal: true,
          }),
        },
      });
      this.updateState({
        screenSharingStreamState: {
          status: { $set: status.CONNECTED },
        },
      });
      this.getPeerList()
        .forEach(peer => this.publishMediaStream(peer, mediaStream));
    };

    const onFailure = () => {
      this.props.toaster.show({
        message: 'Could not share your screen 😕',
        intent: Intent.WARNING,
      });
      this.updateState({
        screenSharingStreamState: {
          status: { $set: status.ERROR },
        },
      });
      this.screenSharingStream = null;
    };

    this.updateState({
      screenSharingStreamState: {
        status: { $set: status.INITIALIZING },
      },
    });


    const toastFeatureNotAvailable = () => {
      this.props.toaster.show({
        message: `Your browser does not support this feature at the moment 😕.
          You can however, share you screen with Chrome using a browser extension`,
        intent: Intent.WARNING,
      });
    };

    switch (browserUtils.getBrowser()) {
      case 'chrome-stable':
        window.chrome.runtime.sendMessage(
          screenShareExtensionId,
          { getVersion: true },
          (response) => {
            if (!response) {
              this.props.toaster.show({
                message: (
                  <span>
                    You need to install a browser plugin to share your screen.
                    <br />
                    <a style={{ color: 'white', textDecoration: 'underline' }}
                      target="_blank" rel="noopener noreferrer"
                      href="https://chrome.google.com/webstore/detail/oorja-screensharing/kobkjhijljmjkobadoknmhakgfpkhiff">
                      Click here to go to the plugin page on chrome web store
                    </a>
                  </span>
                ),
                intent: Intent.WARNING,
              });
              return;
            }

            window.chrome.runtime.sendMessage(
              screenShareExtensionId,
              { getStream: true },
              (result) => {
                if (result === undefined) {
                  onFailure(); // Access to screen denied
                  return;
                }
                const { streamId } = result;
                const constraints = {
                  video: {
                    mandatory: {
                      chromeMediaSource: 'desktop',
                      chromeMediaSourceId: streamId,
                    },
                  },
                };
                navigator.mediaDevices.getUserMedia(constraints)
                  .then(onSuccess, onFailure);
              },
            );
          },
        );
        break;
      default: toastFeatureNotAvailable();
    }
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

  // to be used with media streams
  // only use for local streams and broadcast the speech events over data stream.
  addSpeechTracker(mediaStream) {
    if (!mediaUtils.hasAudio(mediaStream)) return;

    const tracker = hark(mediaStream);
    const streamId = mediaStream.id;
    const broadcastSpeechEvent = (type) => {
      this.roomAPI.sendMessage({
        broadcast: true,
        type,
        content: {
          streamId,
        },
      });
    };
    tracker.on('speaking', () => {
      this.props.streamSpeaking(streamId);
      this.activityListener
        .dispatch(roomActivities.STREAM_SPEAKING_START, { streamId, remote: false });
      broadcastSpeechEvent(messageType.SPEAKING);
    });

    tracker.on('stopped_speaking', () => {
      this.props.streamSpeakingStopped(streamId);
      this.activityListener
        .dispatch(roomActivities.STREAM_SPEAKING_END, { streamId, remote: false });
      broadcastSpeechEvent(messageType.SPEAKING_STOPPED);
    });
    this.speechTrackers[streamId] = tracker;
  }

  removeSpeechTracker(streamId) {
    const speechTracker = this.speechTrackers[streamId];
    if (speechTracker) {
      speechTracker.stop();
      delete this.speechTrackers[streamId];
    }
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
    this.props.resetMediaStreams();
    this.unmountInProgress = true;
    this.getPeerList()
      .forEach(peer => peer.destroy());

    this.cleanupMediaStream(this.primaryMediaStream);
    this.cleanupMediaStream(this.screenSharingStream);

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
          <MaximizeIcon />
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

