/* global window */
import React, { Component } from 'react';
import { connect } from 'react-redux';

import Erizo from '../../modules/Erizo';

/* eslint-disable new-cap */

class Room extends Component {

  constructor(props) {
    super(props);
    this.roomUserId = props.roomUserId;
    this.roomName = props.roomInfo.roomName;
    this.roomToken = localStorage.getItem(`roomToken:${this.roomName}`);
    this.room = Erizo.Room({ token: this.roomToken });

    this.state = {
      roomInfo: props.roomInfo,
      connected: false,
      tryingToConnect: true,
    };
  }

  tryToReconnect() {
    console.log('trying to reconnect');
    if (this.state.connected || this.state.tryingToConnect) return;
    this.setState({ ...this.state, tryingToConnect: true });
    this.props.joinRoom()
      .then(({ roomToken }) => {
        this.roomToken = roomToken;
        this.room = Erizo.Room({ token: this.roomToken });
        this.setRoomConnectionListeners();
        console.log('got new token, reconnecting');
        this.room.connect();
      })
      .catch(() => { location.reload(); });
  }

  setRoomConnectionListeners(room = this.room) {
    room.addEventListener('room-connected', () => {
      this.setState({ ...this.state, connected: true, tryingToConnect: false });
    });

    room.addEventListener('room-disconnected', () => {
      this.setState({ ...this.state, connected: false });
      this.tryToReconnect(); // debounce this later.
    });
  }

  componentWillMount() {

  }

  componentDidMount() {
    this.setRoomConnectionListeners();
    this.room.connect();
    console.log(this.room);
  }

  componentWillUnmount() {
    this.room.disconnect();
  }

  render() {
    return (
      <div>
      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Officia ab deserunt
       tempore consequuntur, sunt saepe eaque obcaecati ad consequatur quisquam sit
      vitae minus voluptate non amet eum cumque ea veritatis.
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

/* eslint-enable new-cap */
