import { Meteor } from 'meteor/meteor';

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';
import { Intent } from '@blueprintjs/core';

import { createRoom } from '../actions/roomConfiguration';
import SupremeToaster from '../components/Toaster';


/*
  Form to input roomName, password. dispatches actions to set
  roomConfiguration in global state.
*/

class RoomSetup extends Component {

  constructor(props) {
    super(props);

    this.state = {
      roomName: '',
      validName: true, // set a random roomName on app bootup? eg. taco-central or something
      passwordEnabled: true,
      password: '',
      waitingForServer: false,
    };
  }

  // accepts boolean to switch form wait state and show spinner etc.
  setWaitState(status) {
    this.setState({
      ...this.state,
      waitingForServer: status,
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    if (!this.state.validName) {
      return;
    }
    const { roomName, passwordEnabled, password } = this.state;
    this.setWaitState(true);
    this.props.createRoom(roomName, passwordEnabled, password).then(
      ({ createdRoomName, roomSecret }) => {
        this.setWaitState(false);
        Meteor.setTimeout(() => {
          SupremeToaster.show({
            intent: Intent.SUCCESS,
            message: 'Room Created ヾ(⌐■_■)ノ♪',
            timeout: 3000,
          });
        }, 100);
        const queryString = passwordEnabled ? '' : `?secret=${roomSecret}`;
        browserHistory.push(`/${createdRoomName}${queryString}`);
      },
      (error) => {
        this.setWaitState(false);
        SupremeToaster.show({
          intent: Intent.WARNING,
          message: error.reason,
          timeout: 4000,
        });
      }
    );
  }

  handleNameChange(event) {
    const candidateName = event.target.value;
    const namePattern = /^[ @a-zA-Z0-9_-]+$/;

    this.setState({
      ...this.state,
      roomName: candidateName,
      validName: namePattern.test(candidateName),
    });
  }

  handlePasswordChange(event) {
    this.setState({
      ...this.state,
      password: event.target.value,
    });
  }

  render() {
    // sexy form goes here. learn some styling yo!
    return (
      <div className="room-setup">
        <form onSubmit = {this.handleSubmit.bind(this)}>
          <div>
            <label htmlFor="room-name">Room Name</label>
            <input type="text" id="room-name"
              value={this.state.roomName}
              onChange={this.handleNameChange.bind(this)}
            />
          </div>
          <div>
            <label htmlFor="room-password">Password</label>
            <input type="password" id="room-password"
              value={this.state.password}
              onChange={this.handlePasswordChange.bind(this)}
            />
          </div>
          <button type="submit">Create Room!</button>
        </form>
      </div>
    );
  }
}

RoomSetup.propTypes = {
  createRoom: React.PropTypes.func,
};


export default connect(null, { createRoom })(RoomSetup);
