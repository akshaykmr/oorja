import { Meteor } from 'meteor/meteor';

import React, { Component } from 'react';
import update from 'immutability-helper';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';
import { Intent, RadioGroup, Radio, Collapse } from '@blueprintjs/core';

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

    this.shareChoices = {
      SECRET_LINK: 'SECRET_LINK',
      PASSWORD: 'PASSWORD',
    };

    this.state = {
      roomName: '',
      validName: true, // set a random roomName on app bootup? eg. taco-central or something
      waitingForServer: false,

      customRoom: false,
      passwordEnabled: true, // TODO
      password: '',
      shareChoice: this.shareChoices.SECRET_LINK,
    };
    this.stateBuffer = this.state;
    this.updateState = this.updateState.bind(this);
    this.handleShareChoice = this.handleShareChoice.bind(this);
    this.toggleCustomRoomForm = this.toggleCustomRoomForm.bind(this);
    this.resetCustomization = this.resetCustomization.bind(this);
  }

  updateState(changes, buffer = this.stateBuffer) {
    this.stateBuffer = update(buffer, changes);
    this.setState(this.stateBuffer);
  }


  handleSubmit(event) {
    event.preventDefault();
    if (!this.state.validName) {
      return;
    }
    const { roomName, passwordEnabled, password } = this.state;
    this.updateState({ waitingForServer: { $set: true } });
    this.props.createRoom(roomName, passwordEnabled, password).then(
      ({ createdRoomName, roomSecret }) => {
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
      }
    );
  }

  handleNameChange(event) {
    const candidateName = event.target.value;
    const namePattern = /^[ @a-zA-Z0-9_-]+$/;

    this.updateState({
      roomName: { $set: candidateName },
      validName: { $set: namePattern.test(candidateName) },
    });
  }

  handleShareChoice(event) {
    this.updateState({
      shareChoice: { $set: event.target.value },
    });
  }

  handlePasswordChange(event) {
    this.updateState({
      password: { $set: event.target.value },
    });
  }

  resetCustomization() {
    this.updateState({
      customRoom: { $set: false },
      password: { $set: '' },
      shareChoice: { $set: this.shareChoices.SECRET_LINK },
    });
  }

  toggleCustomRoomForm(event) {
    event.preventDefault();
    if (this.state.customRoom) {
      this.resetCustomization();
    } else {
      this.updateState({
        customRoom: { $set: true },
      });
    }
  }

  render() {
    // sexy form goes here. learn some styling yo!
    return (
      <div className="roomSetup">
        <form onSubmit = {this.handleSubmit.bind(this)}>
          <label className="pt-label" htmlFor="roomName">Room Name</label>
          <input className="pt-input" type="text" id="roomName"
            placeholder=""
            value={this.state.roomName}
            onChange={this.handleNameChange.bind(this)} />
          <div>
          <br/>
          <button onClick={this.toggleCustomRoomForm}>Customize</button>
          <Collapse isOpen={this.state.customRoom} >
            <div>
              <RadioGroup
                      label="How will others join this room?"
                      onChange={this.handleShareChoice}
                      selectedValue={this.state.shareChoice}>
                      <Radio label="With a secret link that I share with them"
                        value={this.shareChoices.SECRET_LINK} />
                      <Radio label="Those who know the password may enter"
                        value={this.shareChoices.PASSWORD} />
              </RadioGroup>
            </div>
            <Collapse isOpen={this.state.shareChoice === this.shareChoices.PASSWORD} >
              <label className="pt-label" htmlFor="roomPassword">Password</label>
                <input className="pt-input" type="password" id="roomPassword"
                  value={this.state.password}
                  onChange={this.handlePasswordChange.bind(this)}/>
            </Collapse>
          </Collapse>
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
