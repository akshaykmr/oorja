/* global location document window URL */
import { Meteor } from 'meteor/meteor';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import update from 'immutability-helper';
import _ from 'lodash';

import hark from 'hark';
import { Intent } from '@blueprintjs/core';

import MediaPreferences from 'imports/modules/media/storage';

// TODO: move stream handling related functions to streamManager.js

import Erizo from '../../../modules/Erizo';
// constants
import uiConfig from '../../components/Room/constants/uiConfig';
import status from '../../components/Room/constants/status';
import streamTypes from '../../components/Room/constants/streamType';
import mediaStreamPurpose from '../../components/Room/constants/mediaStreamPurpose';
import roomActivities from '../../components/Room/constants/roomActivities';

// room components
import StreamsContainer from '../../components/Room/StreamsContainer/';
import Spotlight from '../../components/Room/Spotlight';

import ActivityListener from '../../../modules/ActivityListener';
import RoomAPI from './RoomAPI';
import Messenger from './Messenger';
import StreamManager from './StreamManager';

import messageType from '../../components/Room/constants/messageType';

import { MEDIASTREAMS_RESET, MEDIASTREAMS_UPDATE } from '../../actions/mediaStreams';
import { SPEAKING, SPEAKING_STOPPED } from '../../actions/stream';

import SupremeToaster from '../../components/Toaster';

import './room.scss';

const { defaultMaxVideoBW, defaultMaxAudioBW } = Meteor.settings;

const roomMessageTypes = {
  SPEECH: 'SPEECH',
  STREAM_SUBSCRIBE_SUCCESS: 'STREAM_SUBSCRIBE_SUCCESS',
  MUTE_VIDEO: 'MUTE_VIDEO',
  UNMUTE_VIDEO: 'UNMUTE_VIDEO',
  MUTE_AUDIO: 'MUTE_AUDIO',
  UNMUTE_AUDIO: 'UNMUTE_AUDIO',
};

class Room extends Component {
  constructor(props) {
    super(props);
    this.roomName = props.roomInfo.roomName;
    this.erizoToken = props.roomStorage.getErizoToken();

    // subscribed incoming data streams
    this.subscribedDataStreams = {}; // streamId -> erizoStream

    this.subscribedMediaStreams = {}; // streamId -> erizoStream
    // note: erizoStream.stream would be of type MediaStream(the browser's MediaStream object)

    this.outgoingDataStreams = {};

    this.speechTrackers = {}; // id -> hark instance

    this.messageHandler = this.messageHandler.bind(this);
    // for passing messages to and from tabs | local or remote(other users)
    this.messenger = new Messenger(this, this.messageHandler);

    this.activeRemoteTabsRegistry = {}; // userSessionId -> [ tabId, ... ]  of tabs set as ready

    // Listens for activities in the room, such as user entering, leaving etc.
    // not naming it roomEvent because that naming is used in the Erizo room.
    this.activityListener = new ActivityListener(roomActivities);

    this.streamManager = new StreamManager(this);

    this.roomAPI = new RoomAPI(this);

    this.applyRoomPreferences = this.applyRoomPreferences.bind(this);
    this.calculateUISize = this.calculateUISize.bind(this);
    this.onWindowResize = _.throttle(this.onWindowResize, 100);
    this.onWindowResize = this.onWindowResize.bind(this);

    this.updateState = this.updateState.bind(this);
    this.tryToConnect = this.tryToConnect.bind(this);
    this.setRoomConnectionListeners = this.setRoomConnectionListeners.bind(this);
    this.setRoomStreamListners = this.setRoomStreamListners.bind(this);
    this.connectUser = this.connectUser.bind(this);
    this.disconnectUser = this.disconnectUser.bind(this);
    // not all of these need to be bound, doing so anyway as I
    // often end up moving them around and getting stuck with the same error for a while.

    this.setDataBroadcastStreamListners = this.setDataBroadcastStreamListners.bind(this);
    this.handleStreamSubscription = this.handleStreamSubscription.bind(this);
    this.setIncomingStreamListners = this.setIncomingStreamListners.bind(this);
    this.handleStreamRemoval = this.handleStreamRemoval.bind(this);
    this.handleStreamSubscriptionSucess = this.handleStreamSubscriptionSucess.bind(this);
    this.incrementVideoStreamCount = this.incrementVideoStreamCount.bind(this);
    this.decrementVideoStreamCount = this.decrementVideoStreamCount.bind(this);
    this.determineStreamContainerSize = this.determineStreamContainerSize.bind(this);
    this.setCustomStreamContainerSize = this.setCustomStreamContainerSize.bind(this);
    this.tabReady = this.tabReady.bind(this);
    this.toggleFullscreen = this.toggleFullscreen.bind(this);
    this.stopScreenSharingStream = this.stopScreenSharingStream.bind(this);

    this.videoQualitySetting = {
      // this is how erizo expects it
      // [minWidth, minHeight, maxWidth, maxHeight]
      '240p': [320, 240, 480, 360],
      '360p': [480, 360, 640, 480],
      '480p': [640, 480, 1280, 720],
      '720p': [1280, 720, 1440, 900],
      '1080p': [1920, 1080, 2560, 1440],
    };

    this.mediaDeviceSettings = MediaPreferences.get() || {};

    this.state = {
      connectionTable: {},
      connectedUsers: [],

      roomConnectionStatus: status.INITIALIZING,
      dataBroadcastStreamStatus: status.TRYING_TO_CONNECT,
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
      videoStreamCount: 0,

      uiSize: this.calculateUISize(),
      roomHeight: window.innerHeight,
      roomWidth: window.innerWidth,


      settings: {
        uiBreakRatio: uiConfig.defaultBreakRatio,
        uiBreakWidth: uiConfig.defaultBreakWidth,
      }, // user preferences such as room component sizes, position etc.
    };
    this.stateBuffer = this.state;
    this.unmountInProgress = false;
  }

  updateState(changes, buffer = this.stateBuffer) {
    this.stateBuffer = update(buffer, changes);
    this.setState(this.stateBuffer);
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

  applyRoomPreferences() {
    // override room settings with user's preferences if any
  }

  tryToConnect() {
    if (this.stateBuffer.roomConnectionStatus === status.TRYING_TO_CONNECT
        || this.unmountInProgress) {
      return;
    }

    const connectToErizo = (erizoToken, recievedNewToken = false) => {
      if (recievedNewToken) {
        console.info('got a new token');
      }
      console.info('trying to connect');
      this.updateState({ roomConnectionStatus: { $set: status.TRYING_TO_CONNECT } });
      this.erizoToken = erizoToken;
      /* eslint-disable new-cap */
      this.sessionId = `${this.props.roomUserId}:${_.random(5000)}`;
      this.erizoRoom = Erizo.Room({ token: this.erizoToken });
      // an erizo data stream to be used for sending 'data' by this user
      this.dataBroadcastStream = Erizo.Stream({
        data: true,
        attributes: {
          userId: this.props.roomUserId,
          sessionId: this.sessionId,
          type: streamTypes.DATA.BROADCAST,

          // [tabId, ...]  list of tabs that are loaded / ready to listen for messages
          activeTabs: [],
        },
      });
      this.setDataBroadcastStreamListners();
      this.dataBroadcastStream.init();
      /* eslint-enable new-cap */
      this.setRoomConnectionListeners();
      this.setRoomStreamListners();
      this.erizoRoom.connect();
    };

    if (this.stateBuffer.roomConnectionStatus === status.INITIALIZING) {
      connectToErizo(this.erizoToken);
      return;
    }

    this.props.oorjaClient.joinRoom(this.props.roomInfo._id)
      .then((response) => {
        connectToErizo(response.data.erizoToken, true);
      })
      .catch(() => { window.location.reload(); });
  }

  // to be only called once when tab is ready
  // indicate that the tab is ready to be discovered by other connected users/their tabs etc.
  tabReady(tabId) {
    const attributes = this.dataBroadcastStream.getAttributes();
    if (attributes.activeTabs.indexOf(tabId) !== -1) {
      throw new Error('tab already set as ready');
    }
    console.log(this);
    const updatedAttributes = update(attributes, {
      activeTabs: { $push: [tabId] },
    });
    this.dataBroadcastStream.setAttributes(updatedAttributes);
  }

  setRoomConnectionListeners(erizoRoom = this.erizoRoom) {
    erizoRoom.addEventListener('room-connected', (roomEvent) => {
      console.info('room connected', roomEvent, erizoRoom);
      this.activityListener.dispatch(roomActivities.ROOM_CONNECTED);
      erizoRoom.publish(this.dataBroadcastStream);
      this.updateState({ roomConnectionStatus: { $set: status.CONNECTED } });
    });

    erizoRoom.addEventListener('room-error', (roomEvent) => {
      console.error('room connection error', roomEvent);
      this.activityListener.dispatch(roomActivities.ROOM_ERROR);
      this.updateState({ roomConnectionStatus: { $set: status.ERROR } });
    });

    erizoRoom.addEventListener('room-disconnected', (roomEvent) => {
      console.info('room disconnected', roomEvent);
      this.activityListener.dispatch(roomActivities.ROOM_DISCONNECTED);
      this.updateState({ roomConnectionStatus: { $set: status.DISCONNECTED } });
      this.stateBuffer.connectedUsers.forEach((user) => {
        let { sessionCount } = user;
        while (sessionCount--) {
          this.disconnectUser(user, this.sessionId);
        }
        console.info('disconnected user', user);
      });
      this.updateState({
        roomConnectionStatus: { $set: status.DISCONNECTED },
        dataBroadcastStreamStatus: { $set: status.TRYING_TO_CONNECT },
        connectedUsers: { $set: [] },
      });
      this.dataBroadcastStream.stop();
      this.props.resetMediaStreams();
      this.subscribedDataStreams = {};
      this.activeRemoteTabsRegistry = {};
      this.subscribedMediaStreams = {};
      this.outgoingDataStreams = {};

      // stop speechTrackers
      Object.keys(this.speechTrackers).forEach(streamId => this.speechTrackers[streamId].stop());
      this.speechTrackers = {};
      setTimeout(() => {
        this.tryToConnect();
      }, 1000);
    });
  }

  setRoomStreamListners(erizoRoom = this.erizoRoom) {
    // when streams are added_to/removed_from the room
    erizoRoom.addEventListener('stream-added', (streamEvent) => {
      const { stream } = streamEvent;
      this.handleStreamSubscription(stream);
      console.info('stream added', streamEvent.stream.getAttributes());
    });

    erizoRoom.addEventListener('stream-subscribed', (streamEvent) => {
      console.info('stream subscribed', streamEvent.stream.getAttributes());
      this.handleStreamSubscriptionSucess(streamEvent.stream);
    });

    erizoRoom.addEventListener('stream-failed', (streamEvent) => {
      // so far none of the streams have failed. however it will definitely
      // be more likely in deployements
      console.error('Oi! stream failed', streamEvent, streamEvent.stream.getAttributes());
      // debugger
      // this.handleStreamRemoval(streamEvent.stream);
    });

    erizoRoom.addEventListener('stream-removed', (streamEvent) => {
      console.info('stream removed', streamEvent.stream.getAttributes());
      this.handleStreamRemoval(streamEvent.stream);
    });
  }

  setDataBroadcastStreamListners() {
    const stream = this.dataBroadcastStream;
    stream.addEventListener('access-accepted', (streamEvent) => {
      console.info('dataBroadcastStream access-accepted', streamEvent);
    });
    stream.addEventListener('access-denied', (streamEvent) => {
      console.error('dataBroadcastStream access-denied', streamEvent);
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
      SupremeToaster.show({
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

  initializePrimaryMediaStream() {
    if (this.primaryMediaStream) {
      // unpublish and destroy
      const speechTracker = this.speechTrackers[this.primaryMediaStream.getID()];
      if (speechTracker) speechTracker.stop();
      this.primaryMediaStream.close();
    }

    const { mediaDeviceSettings } = this;
    // get config and initialize new stream
    // assume this config for now.

    this.primaryMediaStream = Erizo.Stream({
      audio: this.state.primaryMediaStreamState.audio,
      video: this.state.primaryMediaStreamState.video,
      videoSize: this.videoQualitySetting[mediaDeviceSettings.videoQuality],
      data: false,
      attributes: {
        userId: this.props.roomUserId,
        sessionId: this.sessionId,
        type: streamTypes.MEDIA.BROADCAST,
        purpose: mediaStreamPurpose.PRIMARY_MEDIA_STREAM,
        mutedAudio: mediaDeviceSettings.mutedAudio,
        mutedVideo: mediaDeviceSettings.mutedVideo,
      },
    });
    const mediaStream = this.primaryMediaStream;
    mediaStream.addEventListener('access-accepted', () => {
      this.updateState({
        primaryMediaStreamState: {
          status: { $set: status.TRYING_TO_CONNECT },
          audio: { $set: this.primaryMediaStream.stream.getAudioTracks().length > 0 },
          video: { $set: this.primaryMediaStream.stream.getVideoTracks().length > 0 },
        },
      });
      this.streamManager.muteBeforePublish(mediaStream, mediaDeviceSettings);
      this.erizoRoom.publish(
        mediaStream,
        { maxVideoBW: defaultMaxVideoBW, maxAudioBW: defaultMaxAudioBW },
      );
    });
    mediaStream.addEventListener('access-denied', () => {
      SupremeToaster.show({
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
    mediaStream.addEventListener('stream-ended', (streamEvent) => {
      console.info(streamEvent);
    });
    mediaStream.init();
  }

  formMediaStreamState(user, stream, attributes, isLocal = false) {
    const streamId = stream.getID();
    const localStream = isLocal ? this.erizoRoom.localStreams.get(streamId) : null;
    const isScreenShare = attributes.purpose === mediaStreamPurpose.SCREEN_SHARE_STREAM;
    return {
      userId: user.userId,
      streamId,
      local: isLocal,
      type: attributes.type,
      purpose: attributes.purpose,
      // connected when stream subscription is successfull
      status: isLocal ? status.CONNECTED : status.TRYING_TO_CONNECT,
      audio: isLocal ? localStream.stream.getAudioTracks().length > 0 : stream.hasAudio(),
      video: isLocal ? localStream.stream.getVideoTracks().length > 0 : stream.hasVideo(),
      mutedAudio: !!attributes.mutedAudio,
      mutedVideo: !!attributes.mutedVideo,
      screen: isScreenShare,
      streamSource: isLocal ? localStream.stream : null,
      errorReason: '',
      warningReason: '',
    };
  }

  handleStreamSubscription(stream) {
    const attributes = stream.getAttributes();
    const user = _.find(this.props.roomInfo.participants, { userId: attributes.userId });
    if (!user) throw new Meteor.Error('stream publisher not found');

    const { DATA, MEDIA } = streamTypes;

    const subscribeDataBroadcastStream = () => {
      // just a check If I run into this later
      if (this.subscribedDataStreams[stream.getID()]) { // stream already subscribed
        throw new Meteor.Error('over here!');
      }
      if (this.streamManager.isLocalStream(stream)) {
        // do not subscribe our own data stream.
        this.updateState({ dataBroadcastStreamStatus: { $set: status.CONNECTED } });
        console.info('dataBroadcastStream successfully added to the room.');
        this.connectUser(user, this.sessionId);
        setTimeout(() => {
          this.initializePrimaryMediaStream();
        }, 1000);

        // subscribe all remote data broadcast streams prexisting  in the room
        console.info('subscribing all remote data broadcast streams prexisting in the room');
        const currentStreamId = stream.getID();
        this.streamManager.getRemoteStreamList()
          .forEach((remoteStream) => {
            if (remoteStream.getID() !== currentStreamId) {
              const remoteStreamAttributes = remoteStream.getAttributes();
              if ((remoteStreamAttributes.type === DATA.BROADCAST) ||
              remoteStreamAttributes.type === MEDIA.BROADCAST) {
                this.handleStreamSubscription(remoteStream);
              }
            }
          });
      } else {
        if (this.stateBuffer.dataBroadcastStreamStatus !== status.CONNECTED) {
          return; // subscribe remote streams when our dataBroadcastStream is connected.
        }

        const userConnectionState = this.stateBuffer.connectionTable[user.userId];
        if (!userConnectionState) {
          this.updateState({
            connectionTable: {
              [user.userId]: { $set: {} },
            },
          });
        }

        const sessionConnectionState =
          this.stateBuffer.connectionTable[user.userId][attributes.sessionId];

        if (sessionConnectionState) {
          // need to know if this were to happen
          // either stream got published again somehow or sessionId collision
          console.error(
            'another broadcast stream from existing session',
            attributes,
            this.stateBuffer,
          );
          return;
        }

        this.updateState({
          connectionTable: {
            [user.userId]: {
              [attributes.sessionId]: {
                $set: {
                  broadcastSend: status.INITIALIZING,
                  broadcastRecieve: status.INITIALIZING,
                  p2pSend: status.DISCONNECTED,
                  p2pRecieve: status.DISCONNECTED,
                  connectionStatus: status.DISCONNECTED,
                },
              },
            },
          },
        });
        this.setIncomingStreamListners(stream);
        this.erizoRoom.subscribe(stream);
      }
    };

    const subscribeMediaStream = () => {
      const streamId = stream.getID();
      // just a check If I run into this later
      if (this.subscribedMediaStreams[streamId]) { // stream already subscribed
        throw new Meteor.Error('over here!');
      }
      const isLocal = this.streamManager.isLocalStream(stream);
      if (isLocal) {
        if (attributes.purpose === mediaStreamPurpose.PRIMARY_MEDIA_STREAM) {
          this.updateState({
            primaryMediaStreamState: {
              status: { $set: status.CONNECTED },
            },
          });
          this.addSpeechTracker(this.primaryMediaStream);
        } else if (attributes.purpose === mediaStreamPurpose.SCREEN_SHARE_STREAM) {
          this.updateState({
            screenSharingStreamState: {
              status: { $set: status.CONNECTED },
            },
          });
        }
        console.info('adding local media stream');
      } else {
        if (user.userId === this.props.roomUserId) {
          // stream may be from a different session, do not subscribe.
          // probably best to ask users
          // return;
        }
        this.setIncomingStreamListners(stream);
        this.erizoRoom.subscribe(stream);
      }

      this.props.updateMediaStreams({
        [streamId]: {
          $set: this.formMediaStreamState(user, stream, attributes, isLocal),
        },
      });
      if (isLocal && stream.hasVideo()) {
        this.incrementVideoStreamCount();
      }
    };

    switch (attributes.type) {
      case DATA.BROADCAST: subscribeDataBroadcastStream();
        break;
      case DATA.P2P: // subscribeP2PDataStream();
        break;
      case MEDIA.BROADCAST:
      case MEDIA.P2P: subscribeMediaStream();
        break;
      default: console.error('unexpected stream type');
    }
  }


  handleStreamSubscriptionSucess(stream) {
    const attributes = stream.getAttributes();
    const user = _.find(this.props.roomInfo.participants, { userId: attributes.userId });
    const { DATA, MEDIA } = streamTypes;

    const notifySuccessfullSubscription = (broadcast = false, to) => {
      const message = {
        type: messageType.ROOM_MESSAGE,
        to,
        broadcast,
        content: {
          type: roomMessageTypes.STREAM_SUBSCRIBE_SUCCESS,
          content: {
            streamId: stream.getID(),
            publisherUserId: user.userId,
            publisherSessionId: attributes.sessionId,
          },
        },
      };
      this.roomAPI.sendMessage(message);
    };

    const handleDataBroadcastStreamSubscriptionSuccess = () => {
      this.subscribedDataStreams[stream.getID()] = stream;
      this.activeRemoteTabsRegistry[attributes.sessionId] = attributes.activeTabs;
      // recieving broadcast

      this.updateState({
        connectionTable: {
          [user.userId]: {
            [attributes.sessionId]: {
              broadcastRecieve: { $set: status.CONNECTED },
            },
          },
        },
      });
      setTimeout(() => {
        notifySuccessfullSubscription(true); // use broadcast.
      }, 3000); // not a good approach. TODO
      this.updateUserConnection(user.userId, attributes.sessionId);
    };

    const handleMediaSubscriptionSuccess = () => {
      this.props.updateMediaStreams({
        [stream.getID()]: {
          status: { $set: status.CONNECTED },
          streamSource: { $set: stream.stream },
          audio: { $set: stream.stream.getAudioTracks().length > 0 },
          video: { $set: stream.stream.getVideoTracks().length > 0 },
        },
      });
      this.subscribedMediaStreams[stream.getID()] = stream;
      if (stream.hasVideo()) this.incrementVideoStreamCount();
    };

    switch (attributes.type) {
      case DATA.BROADCAST: handleDataBroadcastStreamSubscriptionSuccess();
        break;
      case DATA.P2P: // handleP2PDataStreamSubscriptionSuccess();
        break;
      case MEDIA.BROADCAST:
      case MEDIA.P2P:
        handleMediaSubscriptionSuccess();
        break;
      default: console.error('unexpected stream type');
    }
  }

  setIncomingStreamListners(stream) {
    const attributes = stream.getAttributes();
    const { DATA, MEDIA } = streamTypes;
    switch (attributes.type) {
      case DATA.BROADCAST:
        // set listners for data
        stream.addEventListener('stream-data', (streamEvent) => {
          this.messenger.recieve(attributes.userId, attributes.sessionId, streamEvent.msg);
        });
        stream.addEventListener('stream-attributes-update', () => {
          const updatedAttributes = stream.getAttributes();
          const previousActiveTabs = this.activeRemoteTabsRegistry[attributes.sessionId];
          const currentActiveTabs = updatedAttributes.activeTabs;
          const readyTabs = _.difference(currentActiveTabs, previousActiveTabs);
          this.activeRemoteTabsRegistry[attributes.sessionId] = currentActiveTabs;
          if (readyTabs.length > 1) console.warn('more than one tab ready', readyTabs);// just a check
          readyTabs.forEach((tabId) => {
            console.info('remote-tab-ready', attributes.sessionId, tabId);
            this.activityListener.dispatch(roomActivities.REMOTE_TAB_READY, {
              sessionId: attributes.sessionId,
              tabId,
            });
          });
        });
        break;
      case DATA.P2P:
        stream.addEventListener('stream-data', (streamEvent) => {
          this.messenger.recieve(attributes.userId, attributes.sessionId, streamEvent.msg);
        });
        break;
      case MEDIA.BROADCAST:
      case MEDIA.P2P:
        break;
      default: console.error('unexpected stream type');
    }
  }

  handleStreamRemoval(stream) {
    if (this.unmountInProgress) return;
    const attributes = stream.getAttributes();
    const isLocal = this.streamManager.isLocalStream(stream);
    const user = this.roomAPI.getUserInfo(attributes.userId);
    const { DATA, MEDIA } = streamTypes;

    if (isLocal) {
      console.warn('need to handle this case when I give that option to the user.');
      return;
    }

    const handleBroadcastStreamRemoval = () => {
      if (!this.subscribedDataStreams[stream.getID()]) {
        console.warn('stream was not subscribed earlier.');
        return;
      }
      // remove stream from subscribed streams
      delete this.subscribedDataStreams[stream.getID()];
      delete this.activeRemoteTabsRegistry[attributes.sessionId];
      this.updateUserConnection(user.userId, attributes.sessionId, true); // reset
    };

    switch (attributes.type) {
      case DATA.BROADCAST:
        handleBroadcastStreamRemoval();
        break;
      case DATA.P2P:
        // handleP2PStreamRemoval();
        break;
      case MEDIA.BROADCAST:
      case MEDIA.P2P:
        if (this.props.mediaStreams[stream.getID()].video) this.decrementVideoStreamCount();
        this.props.updateMediaStreams({
          $unset: [stream.getID()],
        });
        this.removeSpeechTracker(stream);
        this.subscribedMediaStreams[stream.getID()] = null;
        break;
      default: console.error('unexpected stream type');
    }

    if (this.streamManager.isLocalStream(stream)) {
      console.info('local stream removed');
    }
  }

  connectUser(user, sessionId) {
    // adds user to connectedUsers list in state, increments sessionCount if already there.
    const connectedUser = _.find(
      this.stateBuffer.connectedUsers,
      { userId: user.userId },
    );

    if (connectedUser) {
      const connectedUserIndex = _.findIndex(
        this.stateBuffer.connectedUsers,
        { userId: connectedUser.userId },
      );

      const updatedUser = update(
        connectedUser,
        {
          sessionCount: { $set: connectedUser.sessionCount + 1 },
          sessionList: { $push: [sessionId] },
        },
      );
      this.updateState({
        connectedUsers: { $splice: [[connectedUserIndex, 1, updatedUser]] },
      });
      this.activityListener.dispatch(roomActivities.USER_SESSION_ADDED, { user, sessionId });
      console.info('incremented session', updatedUser);
    } else {
      this.updateState({
        connectedUsers: { $push: [{ ...user, sessionCount: 1, sessionList: [sessionId] }] },
      });
      this.activityListener.dispatch(roomActivities.USER_JOINED, { user, sessionId });
    }
  }

  // decrements sessionCount for user. removing from connectUsers if reaches 0.
  disconnectUser(user, sessionId) {
    const connectedUserIndex = _.findIndex(
      this.stateBuffer.connectedUsers,
      { userId: user.userId },
    );
    if (connectedUserIndex === -1) {
      throw new Meteor.Error('User does not seem to be connected');
    }

    const connectedUser = this.stateBuffer.connectedUsers[connectedUserIndex];
    if (connectedUser.sessionCount > 1) {
      const updatedUser = update(
        connectedUser,
        {
          sessionCount: { $set: connectedUser.sessionCount - 1 },
          sessionList: { $set: connectedUser.sessionList.filter(id => id !== sessionId) },
        },
      );

      this.updateState({
        connectedUsers: { $splice: [[connectedUserIndex, 1, updatedUser]] },
      });
      this.activityListener.dispatch(roomActivities.USER_SESSION_REMOVED, { user, sessionId });
      console.info('decremented user session', updatedUser);
    } else {
      this.updateState({
        connectedUsers: {
          $splice: [[connectedUserIndex, 1]],
        },
      });
      this.activityListener.dispatch(roomActivities.USER_LEFT, { user, sessionId });
    }
  }

  messageHandler(message) {
    const {
      SPEECH, STREAM_SUBSCRIBE_SUCCESS, MUTE_AUDIO, UNMUTE_AUDIO,
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

    const handleSuccessfulSubscriptionFromRemotePeer = () => {
      const { userId, sessionId } = message.from;
      const eventDetail = roomMessage.content;
      const { publisherUserId, publisherSessionId, streamId } = eventDetail;
      const acknowledgeBroadcastSubscription = () => {
        this.updateState({
          connectionTable: {
            [userId]: {
              [sessionId]: {
                broadcastSend: { $set: status.CONNECTED },
              },
            },
          },
        });
        this.updateUserConnection(userId, sessionId);
      };

      if (publisherUserId === this.props.roomUserId && publisherSessionId === this.sessionId) {
        const stream = this.streamManager.getLocalStreamById(streamId);
        if (!stream) {
          console.error('cannot ack subscription because the local stream was not found', stream);
        }
        const { DATA } = streamTypes;
        switch (stream.getAttributes().type) {
          case DATA.BROADCAST: acknowledgeBroadcastSubscription();
            break;
          case DATA.P2P: // acknowledgeP2PDataStreamSubscriptionSuccess();
            break;
          default: console.error('unexpected stream type');
        }
      }
    };


    // meh this func doest look so good, refactor this later.
    const handleMuteUnmuteChange = (AVKey, value) => { // AVKey = 'muteAudio' | 'muteVideo'
      const { streamId } = message.content.eventDetail;
      if (!this.subscribedMediaStreams[streamId]) {
        return;
      }
      this.props.updateMediaStreams({
        [streamId]: {
          [AVKey]: { $set: value },
        },
      });
    };
    switch (roomMessage.type) {
      case SPEECH: handleSpeechMessage();
        break;
      case STREAM_SUBSCRIBE_SUCCESS: handleSuccessfulSubscriptionFromRemotePeer();
        break;
      case MUTE_AUDIO: handleMuteUnmuteChange('mutedAudio', true);
        break;
      case UNMUTE_AUDIO: handleMuteUnmuteChange('mutedAudio', false);
        break;
      case MUTE_VIDEO: handleMuteUnmuteChange('mutedVideo', true);
        break;
      case UNMUTE_VIDEO: handleMuteUnmuteChange('mutedVideo', false);
        break;
      default: console.error('unrecognised room message');
    }
  }

  updateUserConnection(userId, sessionId, reset = false) {
    const user = this.roomAPI.getUserInfo(userId);
    const previousConnectionStatus =
      this.stateBuffer.connectionTable[userId][sessionId].connectionStatus;

    if (reset) {
      this.updateState({
        connectionTable: {
          [userId]: {
            $unset: [sessionId],
          },
        },
      });
      if (previousConnectionStatus === status.CONNECTED) {
        this.disconnectUser(user, sessionId);
      }
      return;
    }
    const currentConnectionStatus = this.determineUserConnectionStatus(userId, sessionId);
    this.updateState({
      connectionTable: {
        [userId]: {
          [sessionId]: {
            connectionStatus: { $set: currentConnectionStatus },
          },
        },
      },
    });
    if (previousConnectionStatus === status.DISCONNECTED
      && currentConnectionStatus === status.CONNECTED) {
      this.connectUser(user, sessionId);
    } else if (previousConnectionStatus === status.CONNECTED
      && currentConnectionStatus === status.DISCONNECTED) {
      this.disconnectUser(user, sessionId);
    }
  }

  determineUserConnectionStatus(userId, sessionId) {
    const userConnectionState = this.stateBuffer.connectionTable[userId];
    if (!userConnectionState) return status.DISCONNECTED;
    const sessionConnectionState = userConnectionState[sessionId];
    if (!sessionConnectionState) return status.DISCONNECTED;
    const { broadcastSend, broadcastRecieve } = sessionConnectionState;
    return (
      broadcastSend === status.CONNECTED &&
      broadcastRecieve === status.CONNECTED
      // p2pSend === status.CONNECTED &&
      // p2pRecieve === status.CONNECTED
    ) ? status.CONNECTED : status.DISCONNECTED;
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
    this.tryToConnect();
    this.originialBodyBackground = document.body.style.background;
    document.body.style.backgroundColor = '#2e3136';
  }

  componentWillUnmount() {
    this.unmountInProgress = true;
    if (this.primaryMediaStream) {
      this.removeSpeechTracker(this.primaryMediaStream);
      this.primaryMediaStream.stop();
    }
    this.erizoRoom.disconnect();
    window.removeEventListener('resize', this.onWindowResize);

    // restore original body bg color
    document.body.style.backgroundColor = this.originialBodyBackground;
  }

  incrementVideoStreamCount() {
    this.updateState({ videoStreamCount: { $set: this.stateBuffer.videoStreamCount + 1 } });
  }

  decrementVideoStreamCount() {
    this.updateState({ videoStreamCount: { $set: this.stateBuffer.videoStreamCount - 1 } });
  }

  determineStreamContainerSize() {
    const { mediaStreams } = this.props;
    if (!mediaStreams) return uiConfig.COMPACT;
    const atleastOneVideoStream = Object.keys(mediaStreams)
      .map(streamId => mediaStreams[streamId])
      .some(stream =>
        stream.video && !stream.mutedVideo && (stream.status !== status.TRYING_TO_CONNECT));
    if (atleastOneVideoStream) return uiConfig.MEDIUM;

    return uiConfig.COMPACT;
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
    const requestFullscreen =
      element.requestFullscreen ||
      element.webkitRequestFullscreen ||
      element.mozRequestFullScreen ||
      element.msRequestFullscreen;

    const exitFullscreen =
      document.exitFullscreen ||
      document.webkitExitFullscreen ||
      document.mozCancelFullScreen ||
      document.msExitFullscreen;

    const fullscreenElement =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement;

    if (!fullscreenElement) {
      requestFullscreen.call(element);
    } else if (exitFullscreen) {
      exitFullscreen.call(document);
    }
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
          roomAPI={this.roomAPI}
          streamContainerSize={streamContainerSize}
          dispatchRoomActivity={this.activityListener.dispatch}
          roomInfo={this.props.roomInfo}
          connectedUsers={this.state.connectedUsers}/>
        <Spotlight
          roomReady={this.state.dataBroadcastStreamStatus === status.CONNECTED }
          roomInfo={this.props.roomInfo}
          roomStorage={this.props.roomStorage}
          connectedUsers={this.state.connectedUsers}
          roomAPI={this.roomAPI}
          tabReady={this.tabReady}
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
  roomUserId: PropTypes.string.isRequired,
  roomInfo: PropTypes.object.isRequired,
  roomStorage: PropTypes.object.isRequired,
  oorjaClient: PropTypes.object.isRequired,
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


const mapDispatchToProps = dispatch => ({
  updateMediaStreams: (changes) => {
    dispatch({
      type: MEDIASTREAMS_UPDATE,
      payload: {
        changes,
      },
    });
  },
  resetMediaStreams: () => {
    dispatch({
      type: MEDIASTREAMS_RESET,
    });
  },
  streamSpeaking: (streamId) => {
    dispatch({
      type: SPEAKING,
      payload: {
        streamId,
      },
    });
  },
  streamSpeakingStopped: (streamId) => {
    dispatch({
      type: SPEAKING_STOPPED,
      payload: {
        streamId,
      },
    });
  },
});

export { roomMessageTypes };

export default connect(mapStateToProps, mapDispatchToProps)(Room);

