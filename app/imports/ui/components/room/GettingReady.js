import React, { Component } from 'react';

import JoinRoomForm from '../../containers/JoinRoomForm';

export default class GettingReady extends Component {
  render() {
    return (
      <div>
        <JoinRoomForm processComplete={this.props.onReady} />
      </div>
    );
  }
}

GettingReady.propTypes = {
  onReady: React.PropTypes.func.isRequired,
};
