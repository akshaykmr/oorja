import React, { Component } from 'react';
import { browserHistory } from 'react-router';
import { connect } from 'react-redux';
import _ from 'lodash';
import { moment } from 'meteor/momentjs:moment';

import { Meteor } from 'meteor/meteor';

import { Intent } from '@blueprintjs/core';
import SupremeToaster from '../components/Toaster';

import Loading from '../components/Loading';
import PasswordPrompt from './PasswordPrompt';
import GettingReady from '../components/room/GettingReady';
import TestErizo from '../components/room/TestErizo';

import { Rooms as MongoRoom } from '../../collections/common';

import { deleteSecret, getRoomInfo, storeSecret,
  deleteRoomUserId, deleteRoomToken, joinRoom } from '../actions/roomConfiguration';

class Room extends Component {

  constructor(props) {
    super(props);

    const roomName = this.props.params.roomName;
    this.roomName = roomName;
    this.roomSecret = localStorage.getItem(`roomSecret:${roomName}`);
    this.roomUserToken = localStorage.getItem(`roomUserToken:${roomName}`);
    this.roomUserId = localStorage.getItem(`roomUserId:${roomName}`);
    this.props.deleteRoomToken();
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
      initialized: false,
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
      const response = await self.props.getRoomInfo(self.roomName, self.roomUserToken);
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
        if (!roomInfo.existingUser) {
          self.roomUserToken = null;
          self.roomUserId = null;
          self.props.deleteRoomToken();
          self.props.deleteRoomUserId();
        }
        self.gotoStage(self.stages.INITIALIZING);
      }
    }());
  }

  isRoomReady() {
    const lastReadyTime = localStorage.getItem(`roomReady:${this.roomName}`);
    if (!lastReadyTime) return false;
    return moment().isBefore(moment(lastReadyTime).add(4, 'hours'));
  }

  gotoStage(stage) {
    const { INITIALIZING, GETTING_READY, SHOW_TIME } = this.stages;
    const { roomName, roomSecret, roomUserId } = this;
    // const previousStage = this.state.stage;
    // custom action before switching to stage
    switch (stage) {
      case GETTING_READY:
        if (roomUserId) {
          const room = MongoRoom.findOne();
          if (_.find(room.participants, { userId: roomUserId })) {
            if (this.isRoomReady()) {
              this.gotoStage(this.stages.LOADING);
              this.props.joinRoom()
                .then(() => {
                  this.gotoStage(SHOW_TIME);
                });
              return;
            }
          } else {
            this.props.deleteRoomUserId();
          }
        }
        break;
      case SHOW_TIME:
        localStorage.setItem(`roomReady:${roomName}`, moment().toISOString());
        this.roomUserId = localStorage.getItem(`roomUserId:${roomName}`);
        this.roomUserToken = localStorage.getItem(`roomUserToken:${roomName}`);
        this.roomToken = localStorage.getItem(`roomToken:${roomName}`);
        break;
      default: break;
    }

    this.setState({
      ...this.state,
      stage,
    });

    const self = this;
    // custom action after switching to stage.
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
              // should run only once
              updateRoomInfo(roomInfo);
            },
            changed: (latestRoomInfo) => {
              updateRoomInfo(latestRoomInfo);
            },
            removed: () => {
              browserHistory.push('/');
            },
          });
          self.setState({
            ...self.state,
            initialized: true,
          });
          self.gotoStage(self.stages.GETTING_READY);
        }());
        break;
      default: break;
    }
  }

  componentWillUnmount() {
    // cleanup
    if (this.state.initialized) {
      this.roomInfoSubscriptionHandle.stop();
      this.observeRoomInfo.stop();
    }
  }

  render() {
    const { LOADING, PASSWORD_PROMPT, GETTING_READY, SHOW_TIME } = this.stages;
    switch (this.state.stage) {
      case LOADING: return <Loading />;
      case PASSWORD_PROMPT:
        return <PasswordPrompt
                  roomName = {this.roomName}
                  onSuccess = {this.passwordSuccess.bind(this)}
                />;
      case GETTING_READY:
        return <GettingReady
        onReady={() => { this.gotoStage(SHOW_TIME); }}
        isRoomReady={this.isRoomReady()}
        roomUserId={this.roomUserId}/>;
      case SHOW_TIME:
        return (
          <div> Say what?!
          <br/>
          <TestErizo roomToken={this.roomToken}/>
          </div>
        );
      default: return null;
    }
  }
}

Room.propTypes = {
  params: React.PropTypes.object,
  location: React.PropTypes.object,
  deleteSecret: React.PropTypes.func.isRequired,
  getRoomInfo: React.PropTypes.func.isRequired,
  storeSecret: React.PropTypes.func.isRequired,
  deleteRoomUserId: React.PropTypes.func.isRequired,
  deleteRoomToken: React.PropTypes.func.isRequired,
  joinRoom: React.PropTypes.func.isRequired,
};

export default connect(
  null,
  {
    deleteSecret,
    getRoomInfo,
    storeSecret,
    deleteRoomUserId,
    deleteRoomToken,
    joinRoom,
  }
)(Room);
