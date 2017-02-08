/* global location window */
import React, { Component } from 'react';
import { connect } from 'react-redux';

import Erizo from '../../modules/Erizo';

import uiConfig from '../components/room/constants/uiConfig';

// room components
import StreamsContainer from '../components/room/StreamsContainer/';
import Sidebar from '../components/room/Sidebar';
import Spotlight from '../components/room/Spotlight';

class Room extends Component {

  constructor(props) {
    super(props);
    this.roomUserId = props.roomUserId;
    this.roomName = props.roomInfo.roomName;
    this.roomToken = localStorage.getItem(`roomToken:${this.roomName}`);
    /* eslint-disable new-cap */
    this.room = Erizo.Room({ token: this.roomToken });
    /* eslint-enable new-cap */

    this.calculateUISize = this.calculateUISize.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    this.resizeStreamContainer = this.resizeStreamContainer.bind(this);

    this.state = {
      roomInfo: props.roomInfo,
      connected: false,
      tryingToConnect: true,
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
    if (this.state.connected || this.state.tryingToConnect || this.unmountInProgress) return;
    console.log('trying to reconnect');
    this.setState({ ...this.state, tryingToConnect: true });
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
      console.log(roomEvent);
      this.setState({ ...this.state, connected: true, tryingToConnect: false });
    });

    room.addEventListener('room-disconnected', () => {
      this.setState({ ...this.state, connected: false });
      this.tryToReconnect();
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
          resizeStreamContainer={this.resizeStreamContainer}
          streamContainerSize={streamContainerSize}
          roomInfo={this.state.roomInfo}/>
        <Spotlight
          uiSize={uiSize}
          resizeStreamContainer={this.resizeStreamContainer}
          streamContainerSize={streamContainerSize}/>
        <Sidebar uiSize={uiSize}/>
      </div>
    );
  }
}

Room.propTypes = {
  roomUserId: React.PropTypes.string,
  roomInfo: React.PropTypes.object,
  joinRoom: React.PropTypes.func.isRequired,
};

export default connect(null, {})(Room);

