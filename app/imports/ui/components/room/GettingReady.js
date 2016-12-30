import React, { Component } from 'react';
import LoginWithService from '../LoginWithService';
import JoinRoomForm from './JoinRoomForm';

export default class GettingReady extends Component {
  render() {
    return (
      <div>
        <JoinRoomForm />
        <LoginWithService />
      </div>
    );
  }
}
