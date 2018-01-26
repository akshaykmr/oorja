import { Meteor } from 'meteor/meteor';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import update from 'immutability-helper';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';
import { Intent, RadioGroup, Radio, Collapse, Button } from '@blueprintjs/core';

import { shareChoices } from 'imports/modules/room/setup/constants';

import { createRoom } from '../../actions/roomConfiguration';
import SupremeToaster from '../../components/Toaster';


import './roomSetup.scss';

/*
  Form to input roomName, password. dispatches actions to set
  roomConfiguration in global state.
*/


// Should look good starting from 300x400px

class RoomSetup extends Component {
  constructor(props) {
    super(props);

    this.shareChoices = shareChoices;

    this.defaultCustomizationState = {
      roomName: '',
      shareChoice: this.shareChoices.SECRET_LINK,
      password: '',
    };

    this.state = {
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
  }

  updateState(changes, buffer = this.stateBuffer) {
    this.stateBuffer = update(buffer, changes);
    this.setState(this.stateBuffer);
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
    this.props.createRoom(customRoom ? customization : null).then(
      ({ createdRoomName, roomSecret, passwordEnabled }) => {
        this.updateState({ waitingForServer: { $set: false } });
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
        this.updateState({ waitingForServer: { $set: false } });
        SupremeToaster.show({
          intent: Intent.WARNING,
          message: error.reason,
          timeout: 4000,
        });
      },
    );
  }

  handleNameChange(event) {
    const candidateName = event.target.value;
    const namePattern = /^[ @a-zA-Z0-9_-]+$/;

    this.updateState({
      customization: {
        roomName: { $set: candidateName },
      },
      validName: { $set: namePattern.test(candidateName) },
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
    // sexy form goes here. learn some styling yo!
    const {
      roomNameTouched, validName, customization, customRoom, waitingForServer,
    } = this.state;
    return (
      <div>
        <div className="roomSetup room-form">
          <form onSubmit = {this.handleSubmit.bind(this)}>
            <fieldset disabled={this.state.waitingForServer}>
              <Collapse isOpen={this.state.customRoom} >
                <div style={{ padding: '5px' }}>
                  <label className="pt-label" htmlFor="roomName">
                    Room Name
                    <span className="pt-text-muted"> </span>
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
                  className="pt-large"
                  text="Create Room !">
                </Button>
              </div>
          </fieldset>
          </form>
        </div>
      </div>
    );
  }
}

RoomSetup.propTypes = {
  createRoom: PropTypes.func,
};


export default connect(null, { createRoom })(RoomSetup);
