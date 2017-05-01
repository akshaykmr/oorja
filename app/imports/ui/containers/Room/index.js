/* global location window Erizo URL*/
import { Meteor } from 'meteor/meteor';

import React, { Component } from 'react';
import { connect } from 'react-redux';
import update from 'immutability-helper';
import _ from 'lodash';

// import Erizo from '../../modules/Erizo';

import hark from 'hark';

// constants
import uiConfig from '../../components/room/constants/uiConfig';
import status from '../../components/room/constants/status';
import streamTypes from '../../components/room/constants/streamType';
import roomActivities from '../../components/room/constants/roomActivities';

// room components
import StreamsContainer from '../../components/room/StreamsContainer/';
// import Sidebar from '../components/room/Sidebar';
import Spotlight from '../../components/room/Spotlight';

import ActivityListener from '../../../modules/ActivityListener';
import RoomAPI from './RoomAPI';
import Messenger from './Messenger';
import StreamManager from './StreamManager';

import messageType from '../../components/room/constants/messageType';

import { MEDIASTREAMS_RESET, MEDIASTREAMS_UPDATE } from '../../actions/mediaStreams';

import './room.scss';

const roomMessageTypes = {
  SPEECH: 'SPEECH',
};

class Room extends Component {

  constructor(props) {
    super(props);
    this.roomName = props.roomInfo.roomName;
    this.erizoToken = localStorage.getItem(`erizoToken:${this.roomName}`);

    this.erizoRoom = Erizo.Room({ token: this.erizoToken });

    // an erizo data stream to be used for sending 'data' by this user
    this.primaryDataStream = Erizo.Stream({
      data: true,
      attributes: {
        userId: props.roomUserId,
        type: streamTypes.PRIMARY_DATA_STREAM,
      },
    });
    this.setPrimaryDataStreamListners();
    this.primaryDataStream.init();

    // subscribed incoming data streams
    this.subscribedDataStreams = {}; // id -> erizoStream

    this.subscribedMediaStreams = {}; // id -> erizoStream
    // note: erizoStream.stream would be of type MediaStream(the browser's MediaStream object)
    this.speechTrackers = {}; // id -> hark instance

    this.messageHandler = this.messageHandler.bind(this);
    // for passing messages to and from tabs | local or remote(other users)
    this.messenger = new Messenger(this, this.messageHandler);

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
    this.tryToReconnect = this.tryToReconnect.bind(this);
    this.setRoomConnectionListeners = this.setRoomConnectionListeners.bind(this);
    this.setRoomStreamListners = this.setRoomStreamListners.bind(this);
    this.connectUser = this.connectUser.bind(this);
    this.disconnectUser = this.disconnectUser.bind(this);
    // not all of these need to be bound, doing so anyway as I
    // often end up moving them around and getting stuck with the same error for a while.

    this.setPrimaryDataStreamListners = this.setPrimaryDataStreamListners.bind(this);
    this.handleStreamSubscription = this.handleStreamSubscription.bind(this);
    this.setIncomingStreamListners = this.setIncomingStreamListners.bind(this);
    this.handleStreamRemoval = this.handleStreamRemoval.bind(this);
    this.handleStreamSubscriptionSucess = this.handleStreamSubscriptionSucess.bind(this);
    this.incrementVideoStreamCount = this.incrementVideoStreamCount.bind(this);
    this.decrementVideoStreamCount = this.decrementVideoStreamCount.bind(this);

    this.state = {
      connectedUsers: [],

      roomConnectionStatus: status.TRYING_TO_CONNECT,
      primaryDataStreamStatus: status.TRYING_TO_CONNECT,
      primaryMediaStreamStatus: status.TRYING_TO_CONNECT,

      videoStreamCount: 0,

      uiSize: this.calculateUISize(),
      streamContainerSize: uiConfig.MEDIUM,
      roomHeight: innerHeight,
      roomWidth: innerWidth,


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
      const settings = this.state.settings;
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

  tryToReconnect() {
    if (this.stateBuffer.roomConnectionStatus === status.TRYING_TO_CONNECT
        || this.unmountInProgress) {
      return;
    }
    console.info('trying to reconnect');
    this.updateState({ roomConnectionStatus: { $set: status.TRYING_TO_CONNECT } });
    this.props.joinRoom(this.props.roomInfo._id)
      .then(({ erizoToken }) => {
        this.erizoToken = erizoToken;
        /* eslint-disable new-cap */
        this.erizoRoom = Erizo.Room({ token: this.erizoToken });
        /* eslint-enable new-cap */
        this.setRoomConnectionListeners();
        console.info('got new token, reconnecting');
        this.setRoomConnectionListeners();
        this.setRoomStreamListners();
        this.erizoRoom.connect();
      })
      .catch(() => { location.reload(); });
  }

  setRoomConnectionListeners(erizoRoom = this.erizoRoom) {
    erizoRoom.addEventListener('room-connected', (roomEvent) => {
      console.info('room connected', roomEvent);
      console.log(erizoRoom);
      erizoRoom.publish(this.primaryDataStream);
      this.initializePrimaryMediaStream();
      this.updateState({ roomConnectionStatus: { $set: status.CONNECTED } });
    });

    erizoRoom.addEventListener('room-error', (roomEvent) => {
      console.error('room connection error', roomEvent);
      this.updateState({ roomConnectionStatus: { $set: status.DISCONNECTED } });
    });

    erizoRoom.addEventListener('room-disconnected', (roomEvent) => {
      console.info('room disconnected', roomEvent);
      this.stateBuffer.connectedUsers.forEach((user) => {
        let sessionCount = user.sessionCount;
        while (sessionCount--) {
          this.disconnectUser(user);
        }
        console.info('disconnected user', user);
      });
      this.updateState({
        roomConnectionStatus: { $set: status.DISCONNECTED },
        primaryDataStreamStatus: { $set: status.TRYING_TO_CONNECT },
        connectedUsers: { $set: [] },
      });
      this.props.resetMediaStreams();
      this.subscribedDataStreams = {};
      this.subscribedMediaStreams = {};

      // stop speechTrackers
      Object.keys(this.speechTrackers).forEach(streamId => this.speechTrackers[streamId].stop());
      this.speechTrackers = {};
      setTimeout(() => {
        this.tryToReconnect();
      }, 1000);
    });
  }

  setRoomStreamListners(erizoRoom = this.erizoRoom) {
    // when streams are added_to/removed_from the room
    erizoRoom.addEventListener('stream-added', (streamEvent) => {
      const { stream } = streamEvent;
      this.handleStreamSubscription(stream);
      console.info('stream added', streamEvent);
    });

    erizoRoom.addEventListener('stream-subscribed', (streamEvent) => {
      console.info('stream subscribed', streamEvent);
      this.handleStreamSubscriptionSucess(streamEvent.stream);
    });
    // I don't know whether a failed stream would trigger a stream-removed later
    // need to keep this in mind for later
    erizoRoom.addEventListener('stream-failed', (streamEvent) => {
      console.error('stream failed', streamEvent);
      this.handleStreamRemoval(streamEvent.stream);
    });

    erizoRoom.addEventListener('stream-removed', (streamEvent) => {
      console.info('stream removed', streamEvent);
      this.handleStreamRemoval(streamEvent.stream);
    });
  }

  setPrimaryDataStreamListners() {
    const stream = this.primaryDataStream;
    stream.addEventListener('access-accepted', (streamEvent) => {
      console.info('primaryDataStream access-accepted', streamEvent);
    });
    stream.addEventListener('access-denied', (streamEvent) => {
      console.error('primaryDataStream access-denied', streamEvent);
    });
    stream.addEventListener('stream-failed', (streamEvent) => {
      this.updateState({ primaryDataStreamStatus: { $set: status.ERROR } });
      console.error('primaryDataStream stream-failed', streamEvent);
    });
  }

  initializePrimaryMediaStream() {
    if (this.primaryMediaStream) {
      // unpublish and destroy
    }
    // get config and initialize new stream
    // assume this config for now.
    this.primaryMediaStream = Erizo.Stream({
      audio: true,
      video: true,
      data: false,
      attributes: {
        userId: this.props.roomUserId,
        type: streamTypes.PRIMARY_MEDIA_STREAM,
      },
    });
    const mediaStream = this.primaryMediaStream;
    mediaStream.addEventListener('access-accepted', () => {
      this.erizoRoom.publish(mediaStream);
    });
    mediaStream.addEventListener('access-denied', () => {
      this.updateState({
        primaryMediaStream: { $set: status.ERROR },
      });
    });
    mediaStream.addEventListener('stream-ended', () => {
      this.updateState({
        primaryMediaStream: { $set: status.DISCONNECTED },
      });
    });
    mediaStream.init();
  }

  handleStreamSubscription(stream) {
    const attributes = stream.getAttributes();
    const user = _.find(this.props.roomInfo.participants, { userId: attributes.userId });
    if (!user) throw new Meteor.Error('stream publisher not found');

    const { PRIMARY_DATA_STREAM, PRIMARY_MEDIA_STREAM, MEDIA_STREAM } = streamTypes;

    const subscribePrimaryDataStream = () => {
      // just a check If I run into this later
      if (this.subscribedDataStreams[stream.getID()]) { // stream already subscribed
        throw new Meteor.Error('over here!');
      }
      if (this.streamManager.isLocalStream(stream)) {
        // do not subscribe our own data stream.
        this.updateState({ primaryDataStreamStatus: { $set: status.CONNECTED } });
        console.info('primaryDataStream successfully added to the room.');
        this.connectUser(user);

        // subscribe any prexisting streams in the room
        console.info('subscribing any prexisting streams in the room');
        const currentStreamID = stream.getID();
        Object.keys(this.erizoRoom.remoteStreams)
          .map(streamIDString => Number(streamIDString))
          .forEach((streamID) => {
            if (streamID !== currentStreamID) {
              this.handleStreamSubscription(this.erizoRoom.remoteStreams[streamID]);
            }
          });
      } else {
        if (this.stateBuffer.primaryDataStreamStatus !== status.CONNECTED) {
          return; // better to subscribe remote streams when our primaryDataStream is connected.
        }
        this.setIncomingStreamListners(stream);
        this.erizoRoom.subscribe(stream);
      }
    };

    const subscribeMediaStream = () => {
      const streamID = stream.getID();
      // just a check If I run into this later
      if (this.subscribedMediaStreams[streamID]) { // stream already subscribed
        throw new Meteor.Error('over here!');
      }
      const isLocal = this.streamManager.isLocalStream(stream);
      let streamSrc = '';
      if (isLocal) {
        if (attributes.type === PRIMARY_MEDIA_STREAM) {
          streamSrc = URL.createObjectURL(this.primaryMediaStream.stream);
          this.updateState({
            primaryMediaStream: { $set: status.CONNECTED },
          });
          this.addSpeechTracker(this.primaryMediaStream);
        }
        console.info('adding local media stream');
      } else {
        this.setIncomingStreamListners(stream);
        this.erizoRoom.subscribe(stream);
      }

      this.props.updateMediaStreams({
        [streamID]: {
          $set: {
            userId: user.userId,
            streamId: streamID,
            local: isLocal,
            // connected when stream subscription is successfull
            status: isLocal ? status.CONNECTED : status.TRYING_TO_CONNECT,
            audio: stream.hasAudio(),
            video: stream.hasVideo(),
            screen: !!attributes.screenshare,
            streamSrc,
            errorReason: '',
            warningReason: '',
            speaking: false,
          },
        },
      });
      if (isLocal && stream.hasVideo()) {
        this.incrementVideoStreamCount();
      }
    };

    switch (attributes.type) {
      case PRIMARY_DATA_STREAM : subscribePrimaryDataStream();
        break;
      case MEDIA_STREAM:
      case PRIMARY_MEDIA_STREAM: subscribeMediaStream();
        break;
      default: console.error('unexpected stream type');
    }
  }

  // to be used with media streams
  // only use for local streams and broadcast the speech events over data stream.
  addSpeechTracker(stream) {
    if (!stream.hasAudio()) console.error('stream has no audio');
    const tracker = hark(stream.stream); // the browser mediaStream object
    tracker.on('speaking', () => {
      this.props.updateMediaStreams({
        [stream.getID()]: {
          speaking: { $set: true },
        },
      });
      this.roomAPI.sendMessage({
        broadcast: true,
        type: messageType.ROOM_MESSAGE,
        content: {
          type: roomMessageTypes.SPEECH,
          content: {
            status: 'SPEAKING',
            streamId: stream.getID(),
          },
        },
      });
    });

    tracker.on('stopped_speaking', () => {
      this.props.updateMediaStreams({
        [stream.getID()]: {
          speaking: { $set: false },
        },
      });
      this.roomAPI.sendMessage({
        broadcast: true,
        type: messageType.ROOM_MESSAGE,
        content: {
          type: roomMessageTypes.SPEECH,
          content: {
            status: 'STOPPED',
            streamId: stream.getID(),
          },
        },
      });
    });
    this.speechTrackers[stream.getID()] = tracker;
  }

  removeSpeechTracker(stream) {
    const speechTracker = this.speechTrackers[stream.getID()];
    if (speechTracker) speechTracker.stop();
  }

  handleStreamSubscriptionSucess(stream) {
    const attributes = stream.getAttributes();
    const user = _.find(this.props.roomInfo.participants, { userId: attributes.userId });
    const { PRIMARY_DATA_STREAM, PRIMARY_MEDIA_STREAM, MEDIA_STREAM } = streamTypes;

    const handlePrimaryDataStreamSubscriptionSuccess = () => {
      this.subscribedDataStreams[stream.getID()] = stream;
      this.connectUser(user);
    };

    const handleMediaSubscriptionSuccess = () => {
      const streamSrc = URL.createObjectURL(stream.stream);
      this.props.updateMediaStreams({
        [stream.getID()]: {
          status: { $set: status.CONNECTED },
          streamSrc: { $set: streamSrc },
        },
      });
      this.subscribedMediaStreams[stream.getID()] = stream;
      if (stream.hasVideo()) this.incrementVideoStreamCount();
    };
    switch (attributes.type) {
      case PRIMARY_DATA_STREAM: handlePrimaryDataStreamSubscriptionSuccess();
        break;
      case PRIMARY_MEDIA_STREAM:
      case MEDIA_STREAM:
        handleMediaSubscriptionSuccess();
        break;
      default: console.error('unexpected stream type');
    }
  }

  setIncomingStreamListners(stream) {
    const attributes = stream.getAttributes();
    const { PRIMARY_DATA_STREAM, PRIMARY_MEDIA_STREAM } = streamTypes;
    switch (attributes.type) {
      case PRIMARY_DATA_STREAM :
        // set listners for data
        stream.addEventListener('stream-data', (streamEvent) => {
          this.messenger.recieve(streamEvent.msg);
        });
        break;
      case PRIMARY_MEDIA_STREAM:
        break;
      default: console.error('unexpected stream type');
    }
  }

  handleStreamRemoval(stream) {
    if (this.unmountInProgress) return;

    const attributes = stream.getAttributes();
    const user = this.roomAPI.getUserInfo(attributes.userId);
    const { PRIMARY_DATA_STREAM, PRIMARY_MEDIA_STREAM } = streamTypes;

    switch (attributes.type) {
      case PRIMARY_DATA_STREAM:
        // remove stream from subscribed streams
        this.subscribedDataStreams[stream.getID()] = null;

        this.disconnectUser(user);
        break;
      case PRIMARY_MEDIA_STREAM:
        if (this.props.mediaStreams[stream.getID()].video) this.decrementVideoStreamCount();
        this.props.updateMediaStreams({
          [stream.getID()]: { $set: null },
        });
        this.removeSpeechTracker(stream);
        this.subscribedMediaStreams[stream.getID()] = null;
        break;
      default: console.error('unexpected stream type');
    }

    if (this.streamManager.isLocalStream(stream)) {
      console.info('local stream removed');
      return;
    }
  }

  connectUser(user) {
    // adds user to connectedUsers list in state, increments sessionCount if already there.
    const connectedUser = _.find(
      this.stateBuffer.connectedUsers,
      { userId: user.userId }
    );

    if (connectedUser) {
      const connectedUserIndex = _.findIndex(
        this.stateBuffer.connectedUsers,
        { userId: connectedUser.userId }
      );
      if (connectedUserIndex === -1) {
        throw new Meteor.Error("this shouldn't happen, but just in case");
      }

      const updatedUser = update(
        connectedUser,
        {
          sessionCount: { $set: connectedUser.sessionCount + 1 },
        }
      );
      this.updateState({
        connectedUsers: { $splice: [[connectedUserIndex, 1, updatedUser]] },
      });
      console.info('incremented session', updatedUser);
    } else {
      this.updateState({
        connectedUsers: { $push: [{ ...user, sessionCount: 1 }] },
      });
      this.activityListener.dispatch(roomActivities.USER_JOINED, user);
    }
  }

  // decrements sessionCount for user. removing from connectUsers if reaches 0.
  disconnectUser(user) {
    const connectedUserIndex = _.findIndex(
      this.stateBuffer.connectedUsers,
      { userId: user.userId }
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
        }
      );

      this.updateState({
        connectedUsers: { $splice: [[connectedUserIndex, 1, updatedUser]] },
      });
      console.info('decremented uses sessions', updatedUser);
    } else {
      this.updateState({
        connectedUsers: {
          $splice: [[connectedUserIndex, 1]],
        },
      });
      this.activityListener.dispatch(roomActivities.USER_LEFT, user);
    }
  }

  messageHandler(message) { // handler for ROOM_MESSAGE message type.
    const { SPEECH } = roomMessageTypes;
    const handleSpeechMessage = () => {
      const eventDetail = message.content;
      const streamId = eventDetail.streamId;
      switch (eventDetail.status) {
        case 'SPEAKING':
          if (this.props.mediaStreams[streamId]) {
            this.props.updateMediaStreams({
              [streamId]: {
                speaking: { $set: true },
              },
            });
          }
          break;
        case 'STOPPED':
          if (this.props.mediaStreams[streamId]) {
            this.props.updateMediaStreams({
              [streamId]: {
                speaking: { $set: false },
              },
            });
          }
          break;
        default: console.error('unrecognised speech status');
      }
    };
    switch (message.type) {
      case SPEECH: handleSpeechMessage();
        break;
      default: console.error('unrecognised room message');
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
    this.setRoomConnectionListeners();
    this.setRoomStreamListners();
    this.erizoRoom.connect();
  }

  componentWillUnmount() {
    this.unmountInProgress = true;
    if (this.primaryMediaStream) {
      this.removeSpeechTracker(this.primaryMediaStream);
      this.primaryDataStream.close();
    }
    this.erizoRoom.disconnect();
    window.removeEventListener('resize', this.onWindowResize);
  }

  incrementVideoStreamCount() {
    this.updateState({ videoStreamCount: { $set: this.stateBuffer.videoStreamCount + 1 } });
  }

  decrementVideoStreamCount() {
    this.updateState({ videoStreamCount: { $set: this.stateBuffer.videoStreamCount - 1 } });
  }

  render() {
    const { uiSize, streamContainerSize } = this.state;
    return (
      <div className='room page'>
        <StreamsContainer
          uiSize={uiSize}
          mediaStreams={this.props.mediaStreams}
          roomAPI={this.roomAPI}
          streamContainerSize={streamContainerSize}
          roomInfo={this.props.roomInfo}
          connectedUsers={this.state.connectedUsers}/>
        <Spotlight
          roomInfo={this.props.roomInfo}
          connectedUsers={this.state.connectedUsers}
          roomAPI={this.roomAPI}
          dispatchRoomActivity={this.activityListener.dispatch}
          uiSize={uiSize}
          streamContainerSize={streamContainerSize}/>
      </div>
    );
  }
}

Room.propTypes = {
  roomUserId: React.PropTypes.string.isRequired,
  roomInfo: React.PropTypes.object.isRequired,
  joinRoom: React.PropTypes.func.isRequired,
  mediaStreams: React.PropTypes.object.isRequired,
  resetMediaStreams: React.PropTypes.func.isRequired,
  updateMediaStreams: React.PropTypes.func.isRequired,
};


const mapStateToProps = state => ({
  mediaStreams: state.mediaStreams,
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
});


export default connect(mapStateToProps, mapDispatchToProps)(Room);

