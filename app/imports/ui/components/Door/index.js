/* global document window */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import update from 'immutability-helper';
import { isBefore, addHours } from 'date-fns';
import queryString from 'query-string';

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


import './door.scss';

const GENERIC_ERROR_MESSAGE = 'Something went wrong 😕';

class Door extends Component {
  constructor(props) {
    super(props);
    this.roomStorage = null;
    const { params: { roomName } } = this.props.match;
    this.roomName = roomName;
    this.roomSecret = queryString.parse(props.location.search).secret;

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
    this.fetchRoomInfo = this.fetchRoomInfo.bind(this);
    this.enterRoom = this.enterRoom.bind(this);
    this.passwordSuccess = this.passwordSuccess.bind(this);
    this.onUnexpectedServerError = this.onUnexpectedServerError.bind(this);
    this.handleRoomFetchFailure = this.handleRoomFetchFailure.bind(this);
  }

  kick(message = GENERIC_ERROR_MESSAGE, intent = Intent.WARNING) {
    this.props.history.push('/');
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

  handleRoomFetchFailure() {
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
      message: 'Could not connect to room. Please check your link or try later',
      intent: Intent.WARNING,
      timeout: 7000,
    });
    this.props.history.push('/');
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

  fetchRoomInfo() {
    return oorjaClient.fetchRoom(this.roomId)
      .then((response) => {
        const { status } = response;
        if (status !== HttpStatus.OK) {
          this.handleRoomSubscriptionFailure();
          return Promise.reject();
        }
        const roomInfo = response.data;
        if (!roomInfo) {
          this.onUnexpectedServerError();
          return Promise.reject();
        }
        this.updateState({
          roomInfo: { $set: roomInfo },
        });
        return Promise.resolve(roomInfo);
      }, () => { this.handleRoomFetchFailure(); return Promise.reject(); });
  }

  initialize() {
    this.gotoStage(this.stages.LOADING);
    this.fetchRoomInfo()
      .then(() => {
        this.updateState({
          initialized: { $set: true },
        });
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
      .then(this.fetchRoomInfo)
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
    this.props.history.push('/');
  }

  isRoomReady() {
    const lastReadyTime = this.roomStorage.getLastReadyTime();
    if (!lastReadyTime) return false;
    // If the user setup his webcam and all a few hours ago, use those settings.
    return isBefore(new Date(), addHours(new Date(lastReadyTime), 4));
  }

  gotoStage(stage) {
    const { SHOW_TIME } = this.stages;

    // const previousStage = this.stateBuffer.stage;
    // action before switching to stage
    switch (stage) {
      case SHOW_TIME:
        this.roomStorage.saveLastReadyTime(new Date().toISOString());
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
                  onReady={this.enterRoom}
                  oorjaClient={oorjaClient}
                  toaster={toaster}
                  onUnexpectedServerError = {this.onUnexpectedServerError}
                  roomUserId={this.roomUserId}/>;
      case SHOW_TIME:
        return <Room
                  roomId={this.roomId}
                  roomInfo={this.state.roomInfo}
                  updateRoomInfo={this.fetchRoomInfo}
                  roomStorage={this.roomStorage}
                  toaster={toaster}
                  oorjaClient={oorjaClient}
                  roomUserId={this.roomUserId} />;
      default: return null;
    }
  }
}

Door.propTypes = {
  match: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
};

export default Door;
