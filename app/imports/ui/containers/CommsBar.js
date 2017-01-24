import React, { Component } from 'react';

import { connect } from 'react-redux';

class CommsBar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      comms: this.props.comms,
    };
  }

  render() {
    return (
      <div></div>
    );
  }
 }

CommsBar.propTypes = {
  comms: React.PropTypes.string,
  roomInfo: React.PropTypes.object,
};

export default connect(null, {})(CommsBar);
