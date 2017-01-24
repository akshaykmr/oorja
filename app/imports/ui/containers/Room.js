/* global location window */
import React, { Component } from 'react';
import { connect } from 'react-redux';

import Erizo from '../../modules/Erizo';

import CommsBar from './CommsBar';
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

    this.state = {
      roomInfo: props.roomInfo,
      connected: false,
      tryingToConnect: true,
      roomHeight: window.innerHeight,
      roomWidth: window.innerWidth,
      settings: {

      }, // user preferences such as room component sizes, position etc.
    };

    this.unmountInProgress = false;
    this.onWindowResize = this.onWindowResize.bind(this);
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
    console.log(this.room);
  }

  componentWillUnmount() {
    this.unmountInProgress = true;
    window.removeEventListener('resize', this.onWindowResize);
    this.room.disconnect();
  }

  render() {
    const renderComms = () => {
      const { comms } = this.state.roomInfo;
      if (comms === 'text') return null;

      return <CommsBar comms={comms}/>;
    };

    return (
      <div className='room'>
        { renderComms() }
        <Spotlight />
        <Sidebar />
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

