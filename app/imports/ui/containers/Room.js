import React, { Component } from 'react';
import { browserHistory } from 'react-router';
import { connect } from 'react-redux';

import { Meteor } from 'meteor/meteor';

import { Intent } from '@blueprintjs/core';
import SupremeToaster from '../components/Toaster';

import Loading from '../components/Loading';

import { deleteTokens, getRoomInfo, authenticatePassword } from '../actions/roomConfiguration';

class Room extends Component {

  constructor(props) {
    super(props);

    const roomName = this.props.params.roomName;
    this.roomName = roomName;
    this.localStorageToken = localStorage.getItem(`roomToken:${roomName}`);
    this.urlToken = props.location.query.token;

    // if token exists in url then clear stored tokens if any
    if (this.urlToken) {
      this.props.deleteTokens(roomName);
    }

    this.stages = {
      LOADING: 'LOADING', // show a loader or something
      PASSWORD_PROMPT: 'PASSWORD_PROMPT',
      AUTHENTICATING: 'AUTHENTICATING',
      GETTING_READY: 'GETTING_READY',
      SHOW_TIME: 'SHOW_TIME',
    };

    this.state = {
      roomName,
      roomInfo: null,
      stage: this.stages.LOADING,
    };
  }

  componentWillMount() {
    // get room info
    const self = this;
    (async function setRoomInfo() {
      const response = await self.props.getRoomInfo(self.roomName);
      self.setState({
        ...self.state,
        roomInfo: response.payload,
      });

      const { roomInfo } = self.state;
      if (!roomInfo) {
        // room not found
        SupremeToaster.show({
          message: 'Room not found',
          intent: Intent.DANGER,
          timeout: 6000,
        });
        browserHistory.push('/');
        // check tokens
      } else if (!self.localStorageToken && !self.urlToken) {
        // no tokens found, check if passwordEnabled,
        // else room can be only opened with token,
        // either user can create a new room or get a new shareLink.
        if (roomInfo.passwordEnabled) {
          SupremeToaster.show({
            message: 'This room is password protected (°ロ°)☝',
            intent: Intent.PRIMARY,
            timeout: 4000,
          });
          // set state for password prompt.
        } else {
          SupremeToaster.show({
            message: `Please enter the complete link to enter the room.
            Or ask someone to send you a new one.`,
            intent: Intent.WARNING,
            timeout: 10000,
          });
          browserHistory.push('/');
        }
      }
    }());
  }

  componentWillUnmount() {
    // cleanup
  }

  render() {
    if (this.state.stage === this.stages.LOADING) {
      return <Loading />;
    }

    return (
      <div>
        Lel
      </div>
    );
  }
}

Room.propTypes = {
  params: React.PropTypes.object,
  location: React.PropTypes.object,
  deleteTokens: React.PropTypes.func.isRequired,
  getRoomInfo: React.PropTypes.func.isRequired,
};

export default connect(null, { deleteTokens, getRoomInfo, authenticatePassword })(Room);
