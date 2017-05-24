import React, { Component } from 'react';
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';
import classNames from 'classnames';
import { connect } from 'react-redux';
import status from '../../room/constants/status';

import Avatar from '../Avatar';
import VideoStream from './VideoStream';

import uiConfig from '../constants/uiConfig';

import './streamsContainer.scss';

class StreamsContainer extends Component {

  constructor(props) {
    super(props);
    this.renderUserStreamBox = this.renderUserStreamBox.bind(this);

    this.streamContainerStyle = {
      COMPACT: {
        height: '64px',
      },
      MEDIUM: {
        height: uiConfig.streamContainerHeight.MEDIUM,
        minHeight: '100px',
      },
      LARGE: {
        height: uiConfig.streamContainerHeight.LARGE,
        minHeight: '130px',
      },
    };

    this.renderVideoStream = this.renderVideoStream.bind(this);
    this.renderUserStreamBox = this.renderUserStreamBox.bind(this);
  }

  renderVideoStream(stream) {
    const { TRYING_TO_CONNECT, WARNING } = status;
    if (stream.status === TRYING_TO_CONNECT) return null;
    const indicatorClassNames = classNames({
      indicator: true,
      speaking: this.props.streamSpeaking[stream.streamId],
      warning: stream.status === WARNING,
    });
    return (
      <VideoStream
        key={stream.streamId}
        streamSrc={stream.streamSrc}
        muted={stream.local ? 'muted' : ''}
        classNames={indicatorClassNames}>
      </VideoStream>
    );
  }

  renderUserStreamBox(connectedUser) {
    const { mediaStreams, streamSpeaking } = this.props;
    const userMediaStreams = Object.keys(mediaStreams)
      .map(streamId => mediaStreams[streamId])
      .filter(stream => stream.userId === connectedUser.userId);

    const atleastOnePlayingVideo = userMediaStreams.some((stream) => {
      if (!stream.video || stream.mutedVideo) return false;
      if (stream.status === status.TRYING_TO_CONNECT) return false;

      return true;
    });

    const atleastOneSpeakingMutedVideo = userMediaStreams.some(stream =>
      (stream.video && stream.mutedVideo && streamSpeaking[stream.streamId])
    );
    const atleastOneSpeakingMediaStream = (userMediaStreams).some((stream) => {
      if (stream.status === status.TRYING_TO_CONNECT) return false;
      return streamSpeaking[stream.streamId];
    });
    const atleastOneSpeakingAudioStream = (userMediaStreams).some((stream) => {
      if (stream.status === status.TRYING_TO_CONNECT) return false;
      return (streamSpeaking[stream.streamId] && !stream.video);
    });

    const { streamContainerSize } = this.props;
    const { COMPACT, MEDIUM, LARGE } = uiConfig;

    const streamBoxClassNames = classNames({
      streamBox: true,
      compact: streamContainerSize === COMPACT,
      showVideo: atleastOnePlayingVideo && (streamContainerSize !== COMPACT),
      noVideo: !atleastOnePlayingVideo,
      avatarGlow: streamContainerSize === COMPACT ?
        atleastOneSpeakingMediaStream :
        (atleastOneSpeakingAudioStream || atleastOneSpeakingMutedVideo),
    });

    let avatarSize = '';
    switch (streamContainerSize) {
      case COMPACT: avatarSize = '50px';
        break;
      case MEDIUM: avatarSize = atleastOnePlayingVideo ? '30px' : '50px';
        break;
      case LARGE: avatarSize = atleastOnePlayingVideo ? '30px' : '80px';
        break;
      default:
    }

    return (
      <div className={streamBoxClassNames} key={connectedUser.userId}>
        {userMediaStreams.filter(stream => stream.video).map(this.renderVideoStream)}
        <Avatar user={connectedUser} size={avatarSize} />
      </div>
    );
  }

  render() {
    const { streamContainerSize } = this.props;
    const { COMPACT, MEDIUM, LARGE } = uiConfig;
    const streamContainerClassNames = {
      streamContainer: true,
      compactUI: this.props.uiSize === COMPACT,
      compact: streamContainerSize === COMPACT,
      medium: streamContainerSize === MEDIUM,
      large: streamContainerSize === LARGE,
    };

    const streamContainerStyle = this.streamContainerStyle[streamContainerSize];

    return (
      <div
        className={classNames(streamContainerClassNames)}
        style={streamContainerStyle}>
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

const mapStateToProps = state => ({
  mediaStreams: state.mediaStreams,
  streamSpeaking: state.streamSpeaking,
});


StreamsContainer.propTypes = {
  roomAPI: React.PropTypes.object.isRequired,
  mediaStreams: React.PropTypes.object.isRequired,
  dispatchRoomActivity: React.PropTypes.func.isRequired,
  streamSpeaking: React.PropTypes.object.isRequired,
  roomInfo: React.PropTypes.object.isRequired,
  connectedUsers: React.PropTypes.array.isRequired,
  uiSize: React.PropTypes.string.isRequired,
  streamContainerSize: React.PropTypes.string.isRequired,
};

export default connect(mapStateToProps, {})(StreamsContainer);
