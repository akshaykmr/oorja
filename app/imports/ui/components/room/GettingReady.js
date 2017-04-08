import React, { Component } from 'react';

import JoinRoomForm from '../../containers/JoinRoomForm';

export default class GettingReady extends Component {
  render() {
    return (
      <div className="page">
        <JoinRoomForm
          roomInfo={this.props.roomInfo}
          processComplete={this.props.onReady}
          isRoomReady={this.props.isRoomReady}
          roomUserId={this.props.roomUserId}/>
      </div>
    );
  }
}

GettingReady.propTypes = {
  roomInfo: React.PropTypes.object.isRequired,
  onReady: React.PropTypes.func.isRequired,
  isRoomReady: React.PropTypes.bool,
  roomUserId: React.PropTypes.string,
};
