import React, { Component } from 'react';
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';
import classNames from 'classnames';

import { connect } from 'react-redux';

import Avatar from '../Avatar';

import uiConfig from '../constants/uiConfig';

import './streamsContainer.scss';

class StreamsContainer extends Component {

  constructor(props) {
    super(props);
    this.renderUserStreamBox = this.renderUserStreamBox.bind(this);
  }

  renderUserStreamBox(connectedUser) {
    return (
      <div className="streamBox" key={connectedUser.userId}>
        <Avatar user={connectedUser} />
      </div>
    );
  }

  render() {
    const { streamContainerSize } = this.props;
    const streamContainerClassNames = {
      streamContainer: true,
      // compact: uiSize === uiConfig.COMPACT,
      // default: uiSize !== uiConfig.COMPACT,
    };

    return (
      <div
        className={classNames(streamContainerClassNames)}
        style={{ height: streamContainerSize === uiConfig.LARGE ? '18%' : '60px' }}>
        <CSSTransitionGroup
            transitionName="streamBox"
            transitionAppear={true}
            transitionAppearTimeout={200}
            transitionEnterTimeout={1000}
            transitionLeaveTimeout={400}>
            {this.props.connectedUsers.map(this.renderUserStreamBox)}
        </CSSTransitionGroup>
      </div>
    );
  }
 }

StreamsContainer.propTypes = {
  roomAPI: React.PropTypes.object,
  roomInfo: React.PropTypes.object,
  connectedUsers: React.PropTypes.array,
  uiSize: React.PropTypes.string.isRequired,
  streamContainerSize: React.PropTypes.string.isRequired,
};

export default connect(null, {})(StreamsContainer);
