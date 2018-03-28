import { Meteor } from 'meteor/meteor';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import update from 'immutability-helper';
import { Intent, RadioGroup, Radio, Collapse, Button } from '@blueprintjs/core';

import * as HttpStatus from 'http-status-codes';

import oorjaClient from 'imports/modules/oorjaClient';

import { shareChoices } from 'imports/modules/room/setup/constants';

import SupremeToaster from '../../components/Toaster';


/*
  Form to input roomName, password. dispatches actions to set
  roomConfiguration in global state.
*/

const GENERIC_ERROR_MESSAGE = 'Something went wrong 😕';

// Should look good starting from 300x400px

class RoomSetup extends Component {
  constructor(props) {
    super(props);

    this.shareChoices = shareChoices;
    this.namePattern = /^[ @a-zA-Z0-9_-]+$/;

    this.defaultCustomizationState = {
      roomName: '',
      shareChoice: this.shareChoices.SECRET_LINK,
      password: '',
    };

    this.state = {
      isServer: Meteor.isServer,
      customRoom: false,
      waitingForServer: false,
      validName: false,
      roomNameTouched: false, // disable placeholder animation etc. if touched
      customization: this.defaultCustomizationState,
    };

    this.stateBuffer = this.state;
    this.updateState = this.updateState.bind(this);
    this.handleShareChoice = this.handleShareChoice.bind(this);
    this.toggleCustomRoomForm = this.toggleCustomRoomForm.bind(this);
    this.resetCustomization = this.resetCustomization.bind(this);
    this.roomNameTouched = this.roomNameTouched.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleRoomCreationResponse = this.handleRoomCreationResponse.bind(this);
    this.handleRoomCreationError = this.handleRoomCreationError.bind(this);
  }

  updateState(changes, buffer = this.stateBuffer) {
    this.stateBuffer = update(buffer, changes);
    this.setState(this.stateBuffer);
  }

  handleRoomCreationError(message) {
    this.updateState({ waitingForServer: { $set: false } });
    SupremeToaster.show({
      intent: Intent.WARNING,
      message,
      timeout: 4000,
    });
  }

  handleRoomCreationResponse(response) {
    if (response.status !== HttpStatus.CREATED) {
      this.handleRoomCreationError(response.message);
      return;
    }

    const { roomName, roomSecret, passwordEnabled } = response.data;
    this.updateState({ waitingForServer: { $set: false } });
    Meteor.setTimeout(() => {
      SupremeToaster.show({
        intent: Intent.SUCCESS,
        message: 'Room Created ヾ(⌐■_■)ノ♪',
        timeout: 3000,
      });
    }, 100);
    const queryString = passwordEnabled ? '' : `?secret=${roomSecret}`;
    this.props.history.push(`/${roomName}${queryString}`);
  }

  handleSubmit(event) {
    event.preventDefault();
    if (this.stateBuffer.customRoom && !this.stateBuffer.validName) {
      const invalidNameMessage = '😣 Room name must only contain letters, hyphen, underscore or numbers';
      const emptyNameMessage = 'Room Name is empty 😕';
      SupremeToaster.show({
        intent: Intent.WARNING,
        message: !this.stateBuffer.customization.roomName ? emptyNameMessage : invalidNameMessage,
        timeout: 4000,
      });
      return;
    }
    const { customization, customRoom } = this.stateBuffer;
    this.updateState({ waitingForServer: { $set: true } });
    oorjaClient.createRoom(customRoom ? customization : null).then(
      this.handleRoomCreationResponse,
      () => this.handleRoomCreationError(GENERIC_ERROR_MESSAGE),
    );
  }

  handleNameChange(event) {
    const candidateName = event.target.value;
    this.updateState({
      customization: {
        roomName: { $set: candidateName },
      },
      validName: { $set: this.namePattern.test(candidateName) },
    });
    this.roomNameTouched();
  }

  handleShareChoice(event) {
    this.updateState({
      customization: { shareChoice: { $set: event.target.value } },
    });
  }

  handlePasswordChange(event) {
    this.updateState({
      customization: { password: { $set: event.target.value } },
    });
  }

  resetCustomization() {
    this.updateState({
      customRoom: { $set: false },
      validName: { $set: false },
      roomNameTouched: { $set: false },
      customization: { $set: this.defaultCustomizationState },
    });
  }

  toggleCustomRoomForm(event) {
    event.preventDefault(); // remove this.
    if (this.stateBuffer.customRoom) {
      this.resetCustomization();
    } else {
      this.updateState({
        customRoom: { $set: true },
      });
    }
  }

  roomNameTouched() {
    if (this.stateBuffer.roomNameTouched) return;
    this.updateState({
      roomNameTouched: { $set: true },
    });
  }

  render() {
    const {
      roomNameTouched, validName, customization, customRoom, waitingForServer, isServer,
    } = this.state;

    const classNames = 'roomSetup room-form';

    if (isServer) { // render empty space
      return <div className={classNames} />;
    }
    return (
      <div className={classNames}>
        <form onSubmit = {this.handleSubmit.bind(this)} className="animate fade-in">
          <fieldset disabled={this.state.waitingForServer}>
            <div className="field-container">
              <Collapse isOpen={this.state.customRoom} >
                <div style={{ padding: '5px' }}>
                  <label className="pt-label" htmlFor="roomName">
                    Room Name
                  <input className="pt-input" type="text" id="roomName"
                    placeholder="something meaningful"
                    style={{ color: roomNameTouched && !validName ? '#d90000' : 'inherit' }}
                    value={customization.roomName}
                    onChange={this.handleNameChange.bind(this)} />
                  </label>
                  <RadioGroup
                          label="How will others join this room?"
                          onChange={this.handleShareChoice}
                          selectedValue={customization.shareChoice}>
                          <Radio label="With a secret link that I share with them"
                            value={this.shareChoices.SECRET_LINK} />
                          <Radio label="Those who know the password may enter"
                            value={this.shareChoices.PASSWORD} />
                  </RadioGroup>
                </div>
                <Collapse
                  isOpen={customization.shareChoice === this.shareChoices.PASSWORD} >
                  <div style={{ padding: '5px', paddingTop: '0px' }}>
                  <label className="pt-label" htmlFor="roomPassword">Password</label>
                    <input className="pt-input" type="password" id="roomPassword"
                      value={customization.password}
                      onChange={this.handlePasswordChange.bind(this)}/>
                  </div>
                </Collapse>
              </Collapse>
            </div>
            <div className="buttonContainer">
              <button
                type="button"
                className={`pt-button pt-minimal ${customRoom ? 'pt-active' : ''}`}
                onClick={this.toggleCustomRoomForm}>
                Customize
              </button>
              <Button
                type="submit"
                loading={waitingForServer}
                onClick={this.handleSubmit}
                className="pt-large pt-intent-primary"
                text="Create Room !">
              </Button>
            </div>
        </fieldset>
        </form>
      </div>
    );
  }
}

RoomSetup.propTypes = {
  history: PropTypes.object.isRequired,
};

export default RoomSetup;
