import React, { Component } from 'react';

import { connect } from 'react-redux';

class StreamsContainer extends Component {

  render() {
    return (
      <div></div>
    );
  }
 }

StreamsContainer.propTypes = {
  roomInfo: React.PropTypes.object,
};

export default connect(null, {})(StreamsContainer);
