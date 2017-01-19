import React, { Component } from 'react';

import JoinRoomForm from '../../containers/JoinRoomForm';

export default class GettingReady extends Component {
  render() {
    return (
      <div>
        <JoinRoomForm
          processComplete={this.props.onReady}
          isRoomReady={this.props.isRoomReady}
          roomUserId={this.props.roomUserId}/>
      </div>
    );
  }
}

GettingReady.propTypes = {
  onReady: React.PropTypes.func.isRequired,
  isRoomReady: React.PropTypes.bool,
  roomUserId: React.PropTypes.string,
};
