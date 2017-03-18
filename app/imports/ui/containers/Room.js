/* global location window Erizo*/
import { Meteor } from 'meteor/meteor';

import React, { Component } from 'react';
import { connect } from 'react-redux';
import update from 'immutability-helper';
import _ from 'lodash';

// import Erizo from '../../modules/Erizo';

// constants
import uiConfig from '../components/room/constants/uiConfig';
import status from '../components/room/constants/status';
import streamTypes from '../components/room/constants/streamType';
import roomActivities from '../components/room/constants/roomActivities';

// room components
import StreamsContainer from '../components/room/StreamsContainer/';
// import Sidebar from '../components/room/Sidebar';
import Spotlight from '../components/room/Spotlight';
import ActivityListner from './ActivityListner';


class Room extends Component {

  constructor(props) {
    super(props);
    this.roomUserId = props.roomUserId;
    this.roomName = props.roomInfo.roomName;
    this.roomToken = localStorage.getItem(`roomToken:${this.roomName}`);
    /* eslint-disable new-cap */
    this.room = Erizo.Room({ token: this.roomToken });
    // should I use `new` keyword here? licode docs dont use them, And If I did
    // I may run into some issues due to context of `this` etc.

    // an erizo data stream to be used for sending 'data' by this user
    this.primaryDataStream = Erizo.Stream({
      data: true,
      attributes: {
        userId: this.roomUserId,
        type: streamTypes.PRIMARY_DATA_STREAM,
      },
    });
    this.setPrimaryDataStreamListners();
    this.primaryDataStream.init();
    /* eslint-enable new-cap */

    // subscribed incoming data streams
    this.subscribedDataStreams = [];
    this.messageHandlers = {}; // tabId -> handlerFunction


    // Listens for activities in the room, such as user entering, leaving etc.
    // not naming it roomEvent because that naming is used in the Erizo room.
    this.activityListner = new ActivityListner(roomActivities);

    this.calculateUISize = this.calculateUISize.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    this.resizeStreamContainer = this.resizeStreamContainer.bind(this);
    this.connectTab = this.connectTab.bind(this);
    this.dispatchMessage = this.dispatchMessage.bind(this);

    this.state = {
      connectedUsers: [],

      roomConnectionStatus: status.TRYING_TO_CONNECT,
      primaryDataStreamStatus: status.TRYING_TO_CONNECT,

      uiSize: this.calculateUISize(),
      streamContainerSize: uiConfig.COMPACT,
      roomHeight: innerHeight,
      roomWidth: innerWidth,


      settings: {
        uiBreakRatio: uiConfig.defaultBreakRatio,
        uiBreakWidth: uiConfig.defaultBreakWidth,
      }, // user preferences such as room component sizes, position etc.
    };
    this.unmountInProgress = false;
  }

  resizeStreamContainer(size) {
    this.setState({
      ...this.state,
      streamContainerSize: size,
    });
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

  applyRommPreferences() {
    // override room settings with user's preferences if any
  }

  tryToReconnect() {
    if (this.state.roomConnectionStatus === status.TRYING_TO_CONNECT || this.unmountInProgress) {
      return;
    }
    console.info('trying to reconnect');
    this.setState({ ...this.state, roomConnectionStatus: status.TRYING_TO_CONNECT });
    this.props.joinRoom()
      .then(({ roomToken }) => {
        this.roomToken = roomToken;
        /* eslint-disable new-cap */
        this.room = Erizo.Room({ token: this.roomToken });
        /* eslint-enable new-cap */
        this.setRoomConnectionListeners();
        console.info('got new token, reconnecting');
        this.room.connect();
      })
      .catch(() => { location.reload(); });
  }

  setRoomConnectionListeners(room = this.room) {
    room.addEventListener('room-connected', (roomEvent) => {
      console.info('room connected', roomEvent);
      console.log(room);
      this.setRoomStreamListners();
      this.setState({ ...this.state, roomConnectionStatus: status.CONNECTED });
      roomEvent.streams.forEach((stream) => {
        this.handleStreamSubscription(stream);
      });
      room.publish(this.primaryDataStream);
    });

    room.addEventListener('room-error', (roomEvent) => {
      console.error('room connection error', roomEvent);
      this.setState({ ...this.state, roomConnectionStatus: status.DISCONNECTED });
    });

    room.addEventListener('room-disconnected', (roomEvent) => {
      console.info('room disconnected', roomEvent);
      this.setState({ ...this.state, roomConnectionStatus: status.DISCONNECTED });
      this.tryToReconnect();
    });
  }

  setRoomStreamListners(room = this.room) { // when streams are added_to/removed_from the room
    room.addEventListener('stream-added', (streamEvent) => {
      const { stream } = streamEvent;
      if (stream.getID() in room.localStreams) { // published by us
        const attributes = stream.getAttributes();
        if (attributes.type === streamTypes.PRIMARY_DATA_STREAM) {
          this.setState({ ...this.state, primaryDataStreamStatus: status.CONNECTED });
        }
        console.info('local stream added');
      } else {
        // only subscribe subscribe remote streams
        this.handleStreamSubscription(stream);
      }
      console.info('stream added', streamEvent);
    });

    // I don't know whether a failed stream would trigger a stream-removed later
    // need to keep this in mind for later
    room.addEventListener('stream-failed', (streamEvent) => {
      console.error('stream failed', streamEvent);
      this.handleStreamRemoval(streamEvent.stream);
    });

    room.addEventListener('stream-removed', (streamEvent) => {
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
      this.setState({ ...this.state, primaryDataStreamStatus: status.ERROR });
      console.error('primaryDataStream stream-failed', streamEvent);
    });
  }

  // do not pass local streams | only remote streams may be subscribed
  handleStreamSubscription(stream) {
    const attributes = stream.getAttributes();
    const streamID = stream.getID();

    const user = _.find(this.props.roomInfo.participants, { userId: attributes.userId });
    if (!user) throw new Meteor.Error('stream publisher not found');

    const { PRIMARY_DATA_STREAM } = streamTypes;
    switch (attributes.type) {
      case PRIMARY_DATA_STREAM :
        if (_.find(this.state.connectedUsers, { userId: user.userId, streamID })) {
          throw new Meteor.Error('unexpected republishing?'); // should have been removed from state
        }

        // connect user to the room and subscribe the stream and apply listeners

        // just a check If I run into this later
        this.subscribedDataStreams.forEach((s) => {
          if (s.getID() === stream.getID()) throw new Meteor.Error('over here!');
        });
        this.setIncomingStreamListners(stream);
        this.room.subscribe(stream);
        this.subscribedDataStreams.push(stream);
        this.setState(update(this.state, {
          connectedUsers: { $push: [{ ...user, streamID }] },
        }));
        this.activityListner.dispatch(roomActivities.USER_JOINED, user);
        break;
      default: console.error('unexpected stream type');
    }
  }

  setIncomingStreamListners(stream) {
    const { messageHandlers } = this;
    function messageListner(streamEvent) {
      const message = streamEvent.msg;
      // probably would want to add more logic here for different message types later.
      message.to.forEach((tabId) => {
        const handler = messageHandlers[tabId];
        if (!handler) { // this will probably happen a lot if I dynamically import tabs
          console.log('handler not found', tabId, message);
          return;
        }
        handler(message);
      });
    }

    const attributes = stream.getAttributes();
    const { PRIMARY_DATA_STREAM } = streamTypes;
    switch (attributes.type) {
      case PRIMARY_DATA_STREAM :
        // set listners for data
        stream.addEventListener('stream-data', messageListner);
        break;
      default: console.error('unexpected stream type');
    }
  }

  handleStreamRemoval(stream) {
    const attributes = stream.getAttributes();
    const streamID = stream.getID();

    if (streamID in this.room.localStreams) return;

    const { PRIMARY_DATA_STREAM } = streamTypes;
    const user = _.find(this.props.roomInfo.participants, { userId: attributes.userId });

    const userIndex = _.findIndex(
      this.state.connectedUsers,
      { userId: user.userId, streamID }
    );

    if (userIndex === -1) {
      console.error('unexpected: user/stream combo not in state');
    }

    switch (attributes.type) {
      case PRIMARY_DATA_STREAM:

        // disconnect user from the room and remove stream from subscribed streams list
        _.remove(this.subscribedDataStreams, s => s.getID() === streamID);
        this.setState(update(this.state, {
          connectedUsers: {
            $splice: [[userIndex, 1]],
          },
        }));
        this.activityListner.dispatch(roomActivities.USER_LEFT, user);
        break;
      default: console.error('unexpected stream type');
    }
  }

  connectTab(tab, messageHandler, listners) {
    // setup listners for roomActivities for this tab
    if (listners) {
      Object.keys(listners).forEach((activity) => {
        this.activityListner.listen(activity, listners[activity]);
      });
    }
    // setup message handler for this tab
    function registerMessageHandler({ tabId, handler }) {
      const { messageHandlers } = this;
      if (messageHandlers[tabId]) {
        throw new Meteor.Error('handler already registered', tabId, messageHandlers[tabId]);
      }
      messageHandlers[tabId] = handler;
    }
    if (messageHandler) {
      registerMessageHandler(tab.Id, messageHandler);
    }
  }

  dispatchMessage(message) {
    this.primaryDataStream.sendData(message);
  }

  onWindowResize(event) {
    const { innerHeight, innerWidth } = event.target.window;
    this.setState({
      ...this.state,
      uiSize: this.calculateUISize(),
      roomWidth: innerWidth,
      roomHeight: innerHeight,
    });
  }

  componentWillMount() {
    window.addEventListener('resize', this.onWindowResize);
  }

  componentDidMount() {
    this.setRoomConnectionListeners();
    this.room.connect();
  }

  componentWillUnmount() {
    this.unmountInProgress = true;
    this.room.disconnect();
    window.removeEventListener('resize', this.onWindowResize);
  }

  render() {
    const { uiSize, streamContainerSize } = this.state;
    return (
      <div className='room'>
        <StreamsContainer
          uiSize={uiSize}
          resizeStreamContainer={this.resizeStreamContainer}
          streamContainerSize={streamContainerSize}
          roomInfo={this.props.roomInfo}/>
        <Spotlight
          roomInfo={this.props.roomInfo}
          connectedUsers={this.state.connectedUsers}
          connectTab={this.connectTab}
          dispatchMessage={this.dispatchMessage}
          uiSize={uiSize}
          resizeStreamContainer={this.resizeStreamContainer}
          streamContainerSize={streamContainerSize}/>
      </div>
    );
    /* <Sidebar uiSize={uiSize}/>*/
  }
}

Room.propTypes = {
  roomUserId: React.PropTypes.string,
  roomInfo: React.PropTypes.object,
  joinRoom: React.PropTypes.func.isRequired,
};

export default connect(null, {})(Room);

