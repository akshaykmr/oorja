/* global document window */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { browserHistory } from 'react-router';
import update from 'immutability-helper';
import moment from 'moment';

import * as HttpStatus from 'http-status-codes';

import { Meteor } from 'meteor/meteor';
import oorjaClient from 'imports/modules/oorjaClient';

import { RoomStorage } from 'imports/modules/room/storage';

import { Intent } from '@blueprintjs/core';
import Room from 'imports/ui/components/Room';

import PasswordPrompt from 'imports/ui/components/PasswordPrompt';
import toaster from '../../components/Toaster';

import MinimalLogo from '../../components/MinimalLogo';
import GettingReady from '../../components/Room/GettingReady';

import { Rooms as MongoRoom } from '../../../collections/common';


import './door.scss';

const GENERIC_ERROR_MESSAGE = 'Something went wrong 😕';

class Door extends Component {
  constructor(props) {
    super(props);
    this.roomStorage = null;

    const { roomName } = this.props.params;
    this.roomName = roomName;

    this.roomSecret = props.location.query.secret;

    this.stages = {
      LOADING: 'LOADING',
      PASSWORD_PROMPT: 'PASSWORD_PROMPT',
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

    this.setupTrackerToRefreshIfWakingFromSleep();
    this.stateBuffer = this.state;

    this.kick = this.kick.bind(this);
    this.setup = this.setup.bind(this);
    this.initialize = this.initialize.bind(this);
    this.handleRoomLookup = this.handleRoomLookup.bind(this);
    this.passwordSuccess = this.passwordSuccess.bind(this);
    this.onUnexpectedServerError = this.onUnexpectedServerError.bind(this);
  }

  kick(message = GENERIC_ERROR_MESSAGE, intent = Intent.WARNING) {
    browserHistory.push('/');
    toaster.show({
      message,
      intent,
      timeout: 6000,
    });
  }

  setupTrackerToRefreshIfWakingFromSleep() {
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
    this.roomAccessToken = this.roomStorage.getAccessToken();
    this.initialize();
  }

  handleRoomLookup(response) {
    const { status } = response;
    if (status !== HttpStatus.OK) {
      const errorMessage = status === HttpStatus.NOT_FOUND ?
        (
          <div>
            ( ⚆ _ ⚆ ) Room not found.
            <br />
            Please check the link or create a new room.
          </div>
        ) : GENERIC_ERROR_MESSAGE;
      this.kick(errorMessage);
      return Promise.reject();
    }
    return response.data;
  }

  handleRoomSubscriptionFailure() {
    // possible reasons
    // - could be that room link is faulty (invalid secret)
    // - tokens are faulty
    // do a clean run once, if not fixed redirect to /.
    if (!this.stateBuffer.cleanRun) {
      this.roomStorage.deleteRoomAccessToken();
      this.updateState({
        cleanRun: { $set: true },
      });
      this.setup();
      return;
    }

    toaster.show({
      message: 'Could not enter room. Please check your link or try later',
      intent: Intent.WARNING,
      timeout: 7000,
    });
    browserHistory.push('/');
  }


  setupRoomObserver() {
    // set an observer to sync roomInfo changes to the state.
    this.roomInfoObserver = MongoRoom.find({ _id: this.roomId }).observe({
      changed: (latestRoomInfo) => {
        this.updateState({
          roomInfo: { $set: latestRoomInfo },
        });
      },
      removed: () => {
        console.error('room removed');
        browserHistory.push('/');
      },
    });
  }

  setup() {
    oorjaClient.lookupRoom(this.roomName)
      .then(this.handleRoomLookup, () => { this.kick(); return Promise.reject(); })
      .then((minimalRoomInfo) => {
        this.roomId = minimalRoomInfo._id;
        this.roomStorage = new RoomStorage(this.roomId);
        this.roomStorage.saveRoomSecret(this.roomSecret);
        this.roomAccessToken = this.roomStorage.getAccessToken();

        if (!minimalRoomInfo.passwordEnabled && !this.roomSecret) {
          this.kick(`Could not access room.
            Try to obtain a new link OR make a new room and invite others`);
          return Promise.reject();
        }

        if (minimalRoomInfo.passwordEnabled && !this.roomAccessToken) {
          toaster.show({
            message: 'This room is password protected (°ロ°)☝',
            intent: Intent.PRIMARY,
            timeout: 3000,
          });
          this.gotoStage(this.stages.PASSWORD_PROMPT);
          return Promise.resolve();
        }
        this.initialize();
        return Promise.resolve();
      });
  }

  initialize() {
    this.gotoStage(this.stages.LOADING);
    this.roomInfoSubscriptionHandle = oorjaClient.subscribeToRoom(this.roomId);
    this.roomInfoSubscriptionHandle.readyPromise()
      .then(() => {
        // TODO handle case of broken subscription
        const roomInfo = MongoRoom.findOne({ _id: this.roomId });
        if (!roomInfo) {
          this.onUnexpectedServerError();
          return Promise.reject();
        }
        this.setupRoomObserver();
        this.updateState({
          roomInfo: { $set: roomInfo },
          initialized: { $set: true },
        });
        return Promise.resolve();
      }, this.handleRoomSubscriptionFailure) // BUG : promise on reject does not run..
      .then(() => {
        oorjaClient.checkIfExistingUser(this.roomId)
          .then(
            () => {
              if (this.isRoomReady()) {
                this.gotoStage(this.stages.LOADING);
                this.enterRoom();
                return;
              }
              this.gotoStage(this.stages.GETTING_READY);
            },
            () => {
              this.roomStorage.deleteSavedUser();
              this.gotoStage(this.stages.GETTING_READY);
            },
          );
      });
  }

  componentWillMount() {
    document.body.classList.add('room-container');
    this.setup();
  }

  enterRoom() {
    oorjaClient.joinRoom(this.roomId)
      .then(() => this.gotoStage(this.stages.SHOW_TIME), this.onUnexpectedServerError);
  }

  onUnexpectedServerError(message, intent = Intent.WARNING) {
    setTimeout(() => {
      toaster.show({
        message: message || 'Internal Server Error 🤕',
        intent: intent || Intent.DANGER,
        timeout: 8000,
      });
    }, 300);
    browserHistory.push('/');
  }

  isRoomReady() {
    const lastReadyTime = this.roomStorage.getLastReadyTime();
    if (!lastReadyTime) return false;
    return moment().isBefore(moment(lastReadyTime).add(4, 'hours'));
  }

  gotoStage(stage) {
    const { SHOW_TIME } = this.stages;

    // const previousStage = this.stateBuffer.stage;
    // action before switching to stage
    switch (stage) {
      case SHOW_TIME:
        this.roomStorage.saveLastReadyTime(moment().toISOString());
        this.roomUserId = this.roomStorage.getUserId();
        this.roomUserToken = this.roomStorage.getUserToken();
        break;
      default: break;
    }

    this.updateState({
      stage: { $set: stage },
    });

    // Action after switching to stage.
    switch (stage) {
      default: break;
    }
  }

  componentWillUnmount() {
    document.body.classList.remove('room-container');
    // cleanup
    clearInterval(this.SleepTracker);
    if (this.stateBuffer.initialized) {
      this.roomInfoSubscriptionHandle.stop();
      this.roomInfoObserver.stop();
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
                  roomId={this.roomId}
                  oorjaClient={oorjaClient}
                  roomName={this.roomName}
                  onSuccess={this.passwordSuccess}
                  toaster={toaster}
                />;
      case GETTING_READY:
        return <GettingReady
                  roomInfo={this.state.roomInfo}
                  onReady={() => { this.gotoStage(SHOW_TIME); }}
                  oorjaClient={oorjaClient}
                  toaster={toaster}
                  onUnexpectedServerError = {this.onUnexpectedServerError}
                  roomUserId={this.roomUserId}/>;
      case SHOW_TIME:
        return <Room
                  roomId={this.roomId}
                  roomInfo={this.state.roomInfo}
                  roomStorage={this.roomStorage}
                  oorjaClient={oorjaClient}
                  roomUserId={this.roomUserId} />;
      default: return null;
    }
  }
}

Door.propTypes = {
  params: PropTypes.object,
  location: PropTypes.object,
};

export default Door;
