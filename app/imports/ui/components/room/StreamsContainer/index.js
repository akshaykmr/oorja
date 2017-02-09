import React, { Component } from 'react';
import classNames from 'classnames';

import { connect } from 'react-redux';

import uiConfig from '../constants/uiConfig';

import './streamsContainer.scss';

class StreamsContainer extends Component {

  render() {
    const { uiSize, streamContainerSize } = this.props;
    const streamContainerClassNames = {
      streamContainer: true,
      compact: uiSize === uiConfig.COMPACT,
      default: uiSize !== uiConfig.COMPACT,
    };

    return (
      <div
        className={classNames(streamContainerClassNames)}
        style={{ height: streamContainerSize === uiConfig.LARGE ? '18%' : '60px' }}>
      </div>
    );
  }
 }

StreamsContainer.propTypes = {
  roomInfo: React.PropTypes.object,
  uiSize: React.PropTypes.string.isRequired,
  streamContainerSize: React.PropTypes.string.isRequired,
};

export default connect(null, {})(StreamsContainer);
