import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import classNames from 'classnames';
import { connect } from 'react-redux';
import status from '../../Room/constants/status';

import Avatar from '../Avatar';
import VideoStream from '../../media/Video';

import uiConfig from '../constants/uiConfig';

import roomActivities from '../constants/roomActivities';

import './streamsContainer.scss';

class StreamsContainer extends Component {
  constructor(props) {
    super(props);

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

    this.renderUserStreamBox = this.renderUserStreamBox.bind(this);
    this.renderVideoStream = this.renderVideoStream.bind(this);
    this.renderUserStreamBox = this.renderUserStreamBox.bind(this);
  }

  renderVideoStream(stream) {
    const { TRYING_TO_CONNECT, WARNING } = status;
    if (stream.status === TRYING_TO_CONNECT) return null;

    const videoClassNames = classNames({
      videoStream: true,
      mutedVideo: stream.mutedVideo,
      speaking: this.props.streamSpeaking[stream.streamId],
      warning: stream.status === WARNING,
    });
    return (
      <VideoStream
        onClick={() => {
          this.props.dispatchRoomActivity(
            roomActivities.STREAM_CLICKED,
            stream.streamId,
          );
        }}
        key={stream.streamId}
        streamSource={stream.streamSource}
        muted={stream.local || stream.mutedAudio ? 'muted' : ''}
        videoClassNames={videoClassNames}>
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
      (stream.video && stream.mutedVideo && streamSpeaking[stream.streamId]));

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
      <CSSTransition
        key={connectedUser.userId}
        classNames='streamBox'
        timeout={{ enter: 800, leave: 400 }}>
          <div className={streamBoxClassNames}>
            {userMediaStreams.filter(stream => stream.video).map(this.renderVideoStream)}
            <Avatar user={this.props.roomAPI.getUserInfo(connectedUser.userId)} size={avatarSize}
              onClick={() => {
                this.props.dispatchRoomActivity(
                  roomActivities.USER_CLICKED,
                  connectedUser.userId,
                );
              }} />
          </div>
      </CSSTransition>
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
    const tryingToConnect = this.props.connectedUsers.length === 0;
    return (
      <div
        className={classNames(streamContainerClassNames)}
        style={streamContainerStyle}>
        <TransitionGroup appear={true}>
          {this.props.connectedUsers.map(this.renderUserStreamBox)}
        </TransitionGroup>
        { tryingToConnect ?
          (
            <div className="displayText">
              <div className="tryingToConnect animate blink">Connecting</div>
            </div>
          ) : null
        }
      </div>
    );
  }
}

const mapStateToProps = state => ({
  mediaStreams: state.mediaStreams,
  streamSpeaking: state.streamSpeaking,
});


StreamsContainer.propTypes = {
  roomAPI: PropTypes.object.isRequired,
  mediaStreams: PropTypes.object.isRequired,
  dispatchRoomActivity: PropTypes.func.isRequired,
  streamSpeaking: PropTypes.object.isRequired,
  roomInfo: PropTypes.object.isRequired,
  connectedUsers: PropTypes.array.isRequired,
  uiSize: PropTypes.string.isRequired,
  streamContainerSize: PropTypes.string.isRequired,
};

export default connect(mapStateToProps, {})(StreamsContainer);
