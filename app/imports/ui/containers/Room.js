import React, { Component } from 'react';
import { browserHistory } from 'react-router';
import { connect } from 'react-redux';

import { Meteor } from 'meteor/meteor';

import { Intent } from '@blueprintjs/core';
import SupremeToaster from '../components/Toaster';

import Loading from '../components/Loading';
import PasswordPrompt from './PasswordPrompt';
import GettingReady from '../components/room/GettingReady';

import { Rooms as MongoRoom } from '../../collections/common';

import { deleteSecret, getRoomInfo, storeSecret } from '../actions/roomConfiguration';

class Room extends Component {

  constructor(props) {
    super(props);

    const roomName = this.props.params.roomName;
    this.roomName = roomName;
    this.roomSecret = localStorage.getItem(`roomSecret:${roomName}`);
    this.urlRoomSecret = props.location.query.secret;

    // if secret exists in url delete storedSecret
    if (this.urlRoomSecret) {
      this.props.deleteSecret(roomName);
    }

    this.stages = {
      LOADING: 'LOADING', // get some room info
      PASSWORD_PROMPT: 'PASSWORD_PROMPT',
      INITIALIZING: 'INITIALIZING',
      GETTING_READY: 'GETTING_READY',
      SHOW_TIME: 'SHOW_TIME',
    };

    this.state = {
      roomName,
      roomInfo: null,
      stage: this.stages.LOADING,
    };
  }

  passwordSuccess() {
    this.roomSecret = localStorage.getItem(`roomSecret:${this.roomName}`);
    this.gotoStage(this.stages.INITIALIZING);
  }

  componentWillMount() {
    // get room info
    const self = this;
    (async function setRoomInfo() {
      const response = await self.props.getRoomInfo(self.roomName);
      const roomInfo = response.payload;
      if (!roomInfo) {
        // room not found
        SupremeToaster.show({
          message: (
            <div>
              ( ⚆ _ ⚆ ) Room not found.
              <br />
              Please check the link or create a new room.
            </div>
          ),
          intent: Intent.WARNING,
          timeout: 6000,
        });
        browserHistory.push('/');
      } else if (!self.urlRoomSecret && !self.roomSecret) {
        // secret not found: check if passwordEnabled and fetch secret through password.
        // room can be only opened with secret,
        // fail? either user can create a new room or get a new shareLink.
        if (roomInfo.passwordEnabled) {
          SupremeToaster.show({
            message: 'This room is password protected (°ロ°)☝',
            intent: Intent.PRIMARY,
            timeout: 3000,
          });
          // set state for password prompt.
          self.gotoStage(self.stages.PASSWORD_PROMPT);
        } else {
          SupremeToaster.show({
            message: `Please enter the complete link to enter the room.
            Or ask someone to send you a new one.`,
            intent: Intent.WARNING,
            timeout: 10000,
          });
          browserHistory.push('/');
        }
      } else {
        self.gotoStage(self.stages.INITIALIZING);
      }
    }());
  }

  gotoStage(stage) {
    // const previousStage = this.state.stage;
    this.setState({
      ...this.state,
      stage,
    });

    const { INITIALIZING } = this.stages;
    const { roomName, roomSecret } = this;
    const self = this;
    // custom action when switching between stages.
    switch (stage) {
      case INITIALIZING :
        (async function subscribeToRoomInfo() {
          self.gotoStage(self.stages.LOADING);
          self.roomInfoSubscriptionHandle = Meteor.subscribe(
            'room.info',
            roomName,
            roomSecret
          );
          await self.roomInfoSubscriptionHandle.readyPromise();
          const updateRoomInfo = (roomInfo) => {
            self.setState({
              ...this.state,
              roomInfo,
            });
          };
          // set an observer to sync roomInfo changes to the state.
          self.observeRoomInfo = MongoRoom.find({ roomName }).observe({
            added: (roomInfo) => {
              updateRoomInfo(roomInfo);
            },
            changed: (latestRoomInfo) => {
              updateRoomInfo(latestRoomInfo);
            },
            removed: () => {
              console.error('INFO-ERROR');
              browserHistory.push('/');
            },
          });
          self.gotoStage(self.stages.GETTING_READY);
        }());
        break;
      default: break;
    }
  }

  componentWillUnmount() {
    // cleanup
    this.roomInfoSubscriptionHandle.stop();
    this.observeRoomInfo.stop();
  }

  render() {
    const { LOADING, PASSWORD_PROMPT, GETTING_READY } = this.stages;
    switch (this.state.stage) {
      case LOADING: return <Loading />;
      case PASSWORD_PROMPT:
        return <PasswordPrompt
                  roomName = {this.roomName}
                  onSuccess = {this.passwordSuccess.bind(this)}
                />;
      case GETTING_READY:
        return <GettingReady />;
      default : return (
        <div> Say what?! </div>
      );
    }
  }
}

Room.propTypes = {
  params: React.PropTypes.object,
  location: React.PropTypes.object,
  deleteSecret: React.PropTypes.func.isRequired,
  getRoomInfo: React.PropTypes.func.isRequired,
  storeSecret: React.PropTypes.func.isRequired,
};

export default connect(null, { deleteSecret, getRoomInfo, storeSecret })(Room);
