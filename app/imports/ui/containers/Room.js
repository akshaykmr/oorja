/* global location window Erizo*/
import React, { Component } from 'react';
import { connect } from 'react-redux';

// import Erizo from '../../modules/Erizo';

import uiConfig from '../components/room/constants/uiConfig';
import status from '../components/room/constants/status';
// room components
import StreamsContainer from '../components/room/StreamsContainer/';
// import Sidebar from '../components/room/Sidebar';
import Spotlight from '../components/room/Spotlight';


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

    // an erizo data stream to be used for all 'data' purposes
    this.primaryDataStream = Erizo.Stream({
      data: true,
      attributes: {
        userId: this.roomUserId,
        name: 'primary_data_stream',
      },
    });
    this.setPrimaryDataStreamListners();
    this.primaryDataStream.init();
    /* eslint-enable new-cap */

    this.calculateUISize = this.calculateUISize.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    this.resizeStreamContainer = this.resizeStreamContainer.bind(this);

    this.state = {
      roomInfo: props.roomInfo,
      connectionStatus: status.TRYING_TO_CONNECT,
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
    if (this.state.connectionStatus === status.TRYING_TO_CONNECT || this.unmountInProgress) return;
    console.log('trying to reconnect');
    this.setState({ ...this.state, connectionStatus: status.TRYING_TO_CONNECT });
    this.props.joinRoom()
      .then(({ roomToken }) => {
        this.roomToken = roomToken;
        /* eslint-disable new-cap */
        this.room = Erizo.Room({ token: this.roomToken });
        /* eslint-enable new-cap */
        this.setRoomConnectionListeners();
        console.log('got new token, reconnecting');
        this.room.connect();
      })
      .catch(() => { location.reload(); });
  }

  setRoomConnectionListeners(room = this.room) {
    room.addEventListener('room-connected', (roomEvent) => {
      console.info('room connected', roomEvent);
      console.log(room);
      this.setRoomStreamListners();
      this.setState({ ...this.state, connectionStatus: status.CONNECTED });

      room.publish(this.primaryDataStream);
    });

    room.addEventListener('room-error', (roomEvent) => {
      console.error('room connection error', roomEvent);
      this.setState({ ...this.state, connectionStatus: status.DISCONNECTED });
    });

    room.addEventListener('room-disconnected', (roomEvent) => {
      console.info('room disconnected', roomEvent);
      this.setState({ ...this.state, connectionStatus: status.DISCONNECTED });
      this.tryToReconnect();
    });
  }

  setRoomStreamListners(room = this.room) { // when streams are added_to/removed_from the room
    room.addEventListener('stream-added', (streamEvent) => {
      console.log(streamEvent);
      if (streamEvent.stream.getID() in room.localStreams) { // published by us
        if (streamEvent.stream.getAttributes().name === 'primary_data_stream') {
          this.setState({ ...this.state, primaryDataStreamStatus: status.CONNECTED });
        }
        // do not subscribe local streams
        console.info('local stream added');
        return;
      }
      room.subscribe(streamEvent.stream);
      console.info('stream added', streamEvent);
    });

    room.addEventListener('stream-failed', (streamEvent) => {
      console.error('stream failed', streamEvent);
    });

    room.addEventListener('stream-removed', (streamEvent) => {
      console.info('stream removed', streamEvent);
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
    window.removeEventListener('resize', this.onWindowResize);
    this.room.disconnect();
  }

  render() {
    const { uiSize, streamContainerSize } = this.state;
    return (
      <div className='room'>
        <StreamsContainer
          uiSize={uiSize}
          resizeStreamContainer={this.resizeStreamContainer}
          streamContainerSize={streamContainerSize}
          roomInfo={this.state.roomInfo}/>
        <Spotlight
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

