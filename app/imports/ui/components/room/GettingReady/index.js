/* global URL */
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import update from 'immutability-helper';
import * as HttpStatus from 'http-status-codes';
import classNames from 'classnames';
import { Button } from '@blueprintjs/core';
import { getRandomAvatarColor } from 'imports/modules/user/utilities';

import { mediaPreferences, storeKeys as mediaStoreKeys } from 'imports/modules/media/storage';
import LoginWithService from 'imports/ui/components/LoginWithService';

import Avatar from 'imports/ui/components/Room/Avatar';


import './gettingReady.scss';

export default class GettingReady extends Component {
  constructor(props) {
    super(props);
    this.existingUser = _.find(this.props.roomInfo.participants, { userId: this.props.roomUserId });
    this.state = this.getDefaultState();
    this.stateBuffer = this.state;

    this.handleNameChange = this.handleNameChange.bind(this);
    this.enableAnon = this.enableAnon.bind(this);
    this.disableAnon = this.disableAnon.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleJoinRoomResponse = this.handleJoinRoomResponse.bind(this);
    this.handleWebcamSetting = this.handleWebcamSetting.bind(this);
    this.testWebcam = this.testWebcam.bind(this);
  }

  getDefaultState() {
    const user = Meteor.user();
    const getName = () => {
      if (this.existingUser) return this.existingUser.firstName;
      return user ? `${user.profile.firstName} ${user.profile.lastName}` : '';
    };
    const getAvatarColor = () => {
      return this.existingUser ? this.existingUser.textAvatarColor : getRandomAvatarColor();
    };
    const getPicture = () => {
      if (this.existingUser) return this.existingUser.picture;
      return user ? user.profile.picture : null;
    };

    return {
      waiting: false,
      // login related
      loggedIn: !!user,
      loginService: user ? user.profile.loginService : null,

      name: getName(),
      textAvatarColor: getAvatarColor(),
      picture: getPicture(),
      validName: true,
      goAnon: false,

      webcamSetting: 'voiceAndVideo',
      testWebcam: false,
    };
  }

  updateState(changes, buffer = this.stateBuffer) {
    this.stateBuffer = update(buffer, changes);
    this.setState(this.stateBuffer);
  }

  componentWillMount() {
    this.loginStatusTracker = Tracker.autorun(() => {
      const user = Meteor.user();
      const getName = () => {
        if (!user) return '';
        const { firstName, lastName } = user.profile;
        let name = firstName;
        if (lastName) {
          name += ` ${lastName}`;
        }
        return name;
      };
      this.updateState({
        loggedIn: { $set: !!user },
        loginService: { $set: user ? user.profile.loginService : '' },
        name: { $set: getName() },
        picture: { $set: user ? user.profile.picture : null },
        validName: { $set: true },
        goAnon: { $set: user ? false : this.stateBuffer.goAnon },
      });
    });
  }

  componentWillUnmount() {
    this.loginStatusTracker.stop();
  }

  enableAnon() {
    this.updateState({ goAnon: { $set: true } });
  }

  disableAnon() {
    this.updateState({ goAnon: { $set: false } });
  }

  handleNameChange(event) {
    const candidateName = event.target.value;
    const namePattern = /^[ @a-zA-Z0-9_-]+$/;
    this.setState({
      ...this.state,
      validName: namePattern.test(candidateName),
      name: candidateName,
      textAvatarColor: getRandomAvatarColor(),
    });
  }

  handleJoinRoomResponse(response) {
    this.updateState({ waiting: { $set: false } });
    if (response.status !== HttpStatus.OK) {
      this.props.onUnexpectedServerError(response.message);
      return;
    }
    this.props.onReady();
  }

  handleSubmit(event) {
    event.preventDefault();
    if (this.state.waiting || !(this.state.validName)) return;
    if (!Meteor.user() && !this.state.name) {
      return;
    }

    const { name, textAvatarColor } = this.state;
    this.updateState({ waiting: { $set: true } });
    this.props.oorjaClient.joinRoom(this.props.roomInfo._id, name, textAvatarColor)
      .then(this.handleJoinRoomResponse, this.props.onUnexpectedServerError);
  }

  loginInfo() {
    if (!this.state.loggedIn) {
      if (this.state.goAnon) {
        return <span className='animate fade-in'>
          Choose a nickname so others know who you are.
        </span>;
      }
      return <span className='animate fade-in'>Sign in so that others knows who you are.</span>;
    }
    const service = this.state.loginService;
    const greet = `Welcome, you are signed in with ${service} `;
    return (
      <div className="animate fade-in">
        <span className="greeting">{greet}</span>
        <span>
          <button type="button" className="pt-button" onClick={ () => Meteor.logout()}>
            Sign out
          </button>
        </span>
      </div>
    );
  }

  socialLogin() {
    const {
      name, loggedIn, loginService, goAnon,
    } = this.state;
    if (goAnon) return null;
    const loginContainerClasses = classNames({
      blur: !loggedIn && name,
      hidden: this.existingUser,
    });
    return <LoginWithService
      loggedIn={loggedIn}
      loginService={loginService}
      extraClasses={loginContainerClasses}/>;
  }

  handleWebcamSetting(event) {
    this.updateState({ webcamSetting: { $set: event.target.value } });
  }

  testWebcam() {
    this.updateState({ testWebcam: { $set: true } });
  }

  render() {
    const {
      name, loggedIn, picture, waiting, textAvatarColor,
      existingUser, goAnon, validName,
    } = this.state;

    const inputAttr = {
      disabled: loggedIn || !!this.existingUser || waiting,
      value: name,
      onChange: this.handleNameChange,
      className: classNames({ nameInput: true, active: !!name, errorState: !validName }),
      placeholder: 'Your Name...',
    };

    const renderAvatar = () => {
      const avatarStyle = {
        opacity: (!picture && !name) ? 0 : 100,
      };
      return (
        <Avatar
          name={name}
          picture={picture}
          textAvatarColor={textAvatarColor}
          avatarStyle={avatarStyle}
        />
      );
    };

    const buttonIsDisabled = !name || waiting || !validName;
    const buttonAttr = {
      type: 'submit',
      text: 'Ready to join',
      rightIcon: 'arrow-right',
      disabled: buttonIsDisabled,
      loading: waiting,
      className: classNames({
        joinButton: true,
        'pt-large': true,
        'pt-intent-success': true,
        glow: !buttonIsDisabled,
      }),
      onSubmit: this.handleSubmit,
      onClick: this.handleSubmit,
    };

    const renderPreview = () => {
      if (loggedIn || existingUser || goAnon) {
        return (
          <div>
            <div className="interactiveInput">
              {renderAvatar()}
              <input type="text" {...inputAttr}
              ref={
                (input) => {
                  if (input) {
                    this.interactiveInput = input;
                    this.interactiveInput.focus();
                  }
                }
              }/>
            </div>
            <div className="textLink">
              <span className="animate fade-in" onClick={this.disableAnon}>
                Login using an existing account ?
              </span>
            </div>
          </div>
        );
      }
      return (
        <div className="textLink">
          <span className="animate fade-in" onClick={this.enableAnon}>Join anonymously ?</span>
        </div>
      );
    };
    return (
      <div className="page get-ready">
        <div className="login-info" style={{ fontSize: this.state.loggedIn ? '1.1em' : '1.3em' }}>
          {this.loginInfo()}
        </div>

        {this.socialLogin()}

        <div className='JoinRoomForm'>
          <form onSubmit={this.handleSubmit}>
            {renderPreview()}
            <br />
            <div className="webcamSettings">
              {/* <div className="label"> Setup your webcam. </div> */}
              <select value={this.state.webcamSetting} onChange={this.handleWebcamSetting}>
                <option value="voiceAndVideo"> Turn on my video and voice </option>
                <option value="voice">Voice only</option>
                <option value="video">Video only</option>
                <option value="muteAll">Mute both video and voice</option>
              </select>
            </div>
            <div className="textLink">
              <span onClick={this.testWebcam}> Test your webcam </span>
            </div>
            <div className="joinButtonWrapper">
              <Button {...buttonAttr} />
            </div>
          </form>
        </div>
      </div>
    );
  }
}

GettingReady.propTypes = {
  roomInfo: PropTypes.object.isRequired,
  onReady: PropTypes.func.isRequired,
  toaster: PropTypes.object.isRequired,
  oorjaClient: PropTypes.object.isRequired,
  onUnexpectedServerError: PropTypes.func.isRequired,
  roomUserId: PropTypes.string,
};
