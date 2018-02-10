/* global document window */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { browserHistory } from 'react-router';
import { connect } from 'react-redux';
import update from 'immutability-helper';
import _ from 'lodash';
import moment from 'moment';

import { Meteor } from 'meteor/meteor';

import { Intent } from '@blueprintjs/core';
import SupremeToaster from '../../components/Toaster';

import MinimalLogo from '../../components/MinimalLogo';
import PasswordPrompt from '../PasswordPrompt';
import GettingReady from '../../components/room/GettingReady';
import Room from '../Room';
// import TestErizo from '../components/room/TestErizo';

import { Rooms as MongoRoom } from '../../../collections/common';

import { getRoomInfo, deleteRoomSecret, storeRoomSecret, deleteRoomUserId, deleteErizoToken,
  deleteRoomAccessToken, joinRoom } from '../../actions/roomConfiguration';

import './door.scss';

class Door extends Component {
  constructor(props) {
    super(props);

    const { roomName } = this.props.params;
    this.roomName = roomName;
    this.roomSecret = localStorage.getItem(`roomSecret:${roomName}`);
    this.roomAccessToken = localStorage.getItem(`roomAccessToken:${roomName}`);
    this.roomUserToken = localStorage.getItem(`roomUserToken:${roomName}`);
    this.roomUserId = localStorage.getItem(`roomUserId:${roomName}`);
    this.props.deleteErizoToken();
    this.urlRoomSecret = props.location.query.secret;

    // if secret exists in url delete storedSecret
    if (this.urlRoomSecret) {
      this.props.deleteRoomSecret(roomName);
      this.props.storeRoomSecret(roomName, this.urlRoomSecret);
      this.roomSecret = this.urlRoomSecret;
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
      cleanRun: false,
    };

    this.passwordSuccess = this.passwordSuccess.bind(this);
    this.stateBuffer = this.state;

    this.lastActiveTime = (new Date()).getTime();

    this.SleepTracker = setInterval(() => {
      const currentTime = (new Date()).getTime();
      if (currentTime > (this.lastActiveTime + 7500)) {
        // resumed from sleep ?
        if (Meteor.settings.public.refreshOnWake) window.location.reload();
      }
      this.lastActiveTime = currentTime;
    }, 3000); // check every 3 seconds
  }

  updateState(changes, buffer = this.stateBuffer) {
    this.stateBuffer = update(buffer, changes);
    this.setState(this.stateBuffer);
  }

  passwordSuccess() {
    this.roomAccessToken = localStorage.getItem(`roomAccessToken:${this.roomName}`);
    this.gotoStage(this.stages.INITIALIZING);
  }

  checkIfExistingUser() {
    if (!this.roomUserToken) return false;
    return Meteor.callPromise('checkIfExistingUser', this.roomName, this.roomUserToken)
      .then(response => response.data.existingUser);
  }

  beginEntranceProcedure(getFreshAccessToken = false) {
    if (getFreshAccessToken) {
      this.props.deleteRoomAccessToken();
      this.updateState({
        cleanRun: { $set: true },
      });
    }

    const self = this;
    (async function setRoomInfo() {
      const response = await self.props.getRoomInfo(self.roomName);
      const roomInfo = response.payload.data;

      const isExistingUser = await self.checkIfExistingUser();
      self.roomId = roomInfo ? roomInfo._id : null;
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
      } else if (!roomInfo.passwordEnabled && !self.roomSecret) {
        // fail? either user can create a new room or get a new shareLink.
        SupremeToaster.show({
          message: `Could not access room.
          Try to obtain a new link OR make a new room and invite others`,
          intent: Intent.WARNING,
          timeout: 10000,
        });
        browserHistory.push('/');
      } else if (roomInfo.passwordEnabled && !self.roomAccessToken) {
        SupremeToaster.show({
          message: 'This room is password protected (°ロ°)☝',
          intent: Intent.PRIMARY,
          timeout: 3000,
        });
        self.gotoStage(self.stages.PASSWORD_PROMPT);
      } else {
        if (!isExistingUser) {
          delete self.roomUserToken;
          delete self.roomUserId;
          self.props.deleteRoomUserId();
        }
        self.gotoStage(self.stages.INITIALIZING);
      }
    }());
  }

  componentWillMount() {
    document.body.classList.add('room-container');
    this.beginEntranceProcedure();
  }

  isRoomReady() {
    const lastReadyTime = localStorage.getItem(`roomReady:${this.roomName}`);
    if (!lastReadyTime) return false;
    return moment().isBefore(moment(lastReadyTime).add(4, 'hours'));
  }

  gotoStage(stage) {
    const { INITIALIZING, GETTING_READY, SHOW_TIME } = this.stages;
    const {
      roomName, roomSecret, roomUserId, roomAccessToken,
    } = this;
    // const previousStage = this.stateBuffer.stage;
    // custom action before switching to stage
    switch (stage) {
      case GETTING_READY:
        if (roomUserId) {
          const room = MongoRoom.findOne({ _id: this.roomId });
          if (_.find(room.participants, { userId: roomUserId })) {
            if (this.isRoomReady()) {
              this.gotoStage(this.stages.LOADING);
              this.props.joinRoom(this.roomId)
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
        break;
      default: break;
    }

    this.updateState({
      stage: { $set: stage },
    });

    const self = this;
    // custom action after switching to stage.
    switch (stage) {
      case INITIALIZING:
        (async function subscribeToRoomInfo() {
          self.gotoStage(self.stages.LOADING);
          self.roomInfoSubscriptionHandle = Meteor.subscribe(
            'room.info',
            roomName,
            {
              roomAccessToken: roomAccessToken || '',
              roomSecret: roomSecret || '',
            },
          );
          await self.roomInfoSubscriptionHandle.readyPromise();
          const roomInfo = MongoRoom.findOne({ _id: self.roomId });
          self.updateState({
            roomInfo: { $set: roomInfo },
          });
          if (!roomInfo) {
            console.error('room info not found');
            // possible reasons
            // - could be that room link is faulty (invalid secret)
            // - tokens are faulty
            // do a clean run once, if not fixed redirect to /.
            if (self.stateBuffer.cleanRun) {
              SupremeToaster.show({
                message: 'Could not enter room. Please check your link or try later',
                intent: Intent.WARNING,
                timeout: 7000,
              });
              browserHistory.push('/');
              return;
            }
            self.beginEntranceProcedure(true);
            return;
          }

          // set an observer to sync roomInfo changes to the state.
          self.observeRoomInfo = MongoRoom.find({ roomName }).observe({
            changed: (latestRoomInfo) => {
              self.updateState({
                roomInfo: { $set: latestRoomInfo },
              });
            },
            removed: () => {
              console.error('room removed');
              browserHistory.push('/');
            },
          });
          self.updateState({
            initialized: { $set: true },
          });
          self.gotoStage(self.stages.GETTING_READY);
        }());
        break;
      default: break;
    }
  }

  componentWillUnmount() {
    document.body.classList.remove('room-container');
    // cleanup
    clearInterval(this.SleepTracker);
    if (this.stateBuffer.initialized) {
      this.roomInfoSubscriptionHandle.stop();
      this.observeRoomInfo.stop();
    }
  }

  render() {
    const {
      LOADING, PASSWORD_PROMPT, GETTING_READY, SHOW_TIME,
    } = this.stages;
    switch (this.state.stage) {
      case LOADING:
        return (
          <div className='loading page'>
            <div className="loader spin-infinite">
              <MinimalLogo />
            </div>
          </div>
        );
      case PASSWORD_PROMPT:
        return <PasswordPrompt
                  roomName = {this.roomName}
                  onSuccess = {this.passwordSuccess}
                />;
      case GETTING_READY:
        return <GettingReady
        roomInfo={this.state.roomInfo}
        onReady={() => { this.gotoStage(SHOW_TIME); }}
        roomUserId={this.roomUserId}/>;
      case SHOW_TIME:
        return <Room
        roomInfo={this.state.roomInfo}
        joinRoom={this.props.joinRoom}
        roomUserId={this.roomUserId} />;
      default: return null;
    }
  }
}

Door.propTypes = {
  params: PropTypes.object,
  location: PropTypes.object,
  storeRoomSecret: PropTypes.func.isRequired,
  deleteRoomSecret: PropTypes.func.isRequired,
  getRoomInfo: PropTypes.func.isRequired,
  deleteRoomUserId: PropTypes.func.isRequired,
  deleteErizoToken: PropTypes.func.isRequired,
  deleteRoomAccessToken: PropTypes.func.isRequired,
  joinRoom: PropTypes.func.isRequired,
};

export default connect(
  null,
  {
    storeRoomSecret,
    deleteRoomSecret,
    getRoomInfo,
    deleteRoomUserId,
    deleteErizoToken,
    deleteRoomAccessToken,
    joinRoom,
  },
)(Door);
