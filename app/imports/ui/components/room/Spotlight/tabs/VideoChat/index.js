import React, { Component } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import classNames from 'classnames';
// import uiConfig from '../../../constants/uiConfig';

import Avatar from '../../../Avatar';
import roomActivities from '../../../constants/roomActivities';

import VideoStream from '../../../../media/Video';

import tabPropTypes from '../tabPropTypes';
import status from '../../../constants/status';
import './videoChat.scss';

class VideoChat extends Component {
  constructor(props) {
    super(props);

    this.state = {
      pin: false,
      pinnedStreamId: null,
      focussedStreamId: null,
      idle: false,
    };

    this.resetTimer = this.resetTimer.bind(this);

    this.idleTimeout = 5.0; // seconds
    this.idleSecondsCounter = 0;
    window.addEventListener('click', this.resetTimer);

    window.addEventListener('mousemove', this.resetTimer);

    window.addEventListener('keypress', this.resetTimer);

    const checkIdleTime = () => {
      this.idleSecondsCounter += 2000;
      if (this.idleSecondsCounter > this.idleTimeout * 1000) {
        this.setState({
          ...this.state,
          idle: true,
        });
      }
    };


    this.windowIntervalId = setInterval(checkIdleTime, 2000);

    this.services = {
      Google: {
        icon: 'ion-googly',
        color: '#dd4b39',
      },
      Facebook: {
        icon: 'ion-book-of-faces',
        color: '#3b5998',
      },
      Twitter: {
        icon: 'ion-blue-birdy',
        color: '#1da1f2',
      },
      LinkedIn: {
        icon: 'ion-spam-central',
        color: '#0077b5',
      },
      Github: {
        icon: 'ion-git-hub',
        color: '#24292e',
      },
      Twitch: {
        icon: 'ion-twitchy',
        color: '#6441a4',
      },
    };

    this.goToInfoTab = this.goToInfoTab.bind(this);
    this.handleScreenShareClick = this.handleScreenShareClick.bind(this);
    this.updateFocussedMediaStream = _.throttle(this.updateFocussedMediaStream, 2000);
    this.temporaryPin = false;
    this.pinTimeoutId = null;
    this.props.roomAPI.addActivityListener(roomActivities.STREAM_CLICKED, (streamId) => {
      if (this.pinTimeoutId) clearTimeout(this.pinTimeoutId);
      this.setState({
        ...this.state,
        pin: true,
        pinnedStreamId: streamId,
      });
      setTimeout(() => this.setState({ ...this.state, pin: false }), 30000);
    });
    this.props.roomAPI
      .addActivityListener(roomActivities.STREAM_SPEAKING_START, ({ streamId, remote }) => {
        if (remote) {
          this.updateFocussedMediaStream(streamId);
        }
      });
  }

  updateFocussedMediaStream(streamId) {
    this.setState({
      ...this.state,
      focussedStreamId: streamId,
    });
  }

  resetTimer() {
    if (this.state.idle) {
      this.setState({
        ...this.state,
        idle: false,
      });
    }
    this.idleSecondsCounter = 0;
  }

  componentWillUnmount() {
    clearInterval(this.windowIntervalId);
    window.removeEventListener('onclick', this.resetTimer);
    window.removeEventListener('onmousemove', this.resetTimer);
    window.removeEventListener('onkeypress', this.resetTimer);
  }
  getMediaStreamList() {
    return Object.keys(this.props.mediaStreams)
      .map(streamId => this.props.mediaStreams[streamId]);
  }

  allLocalStreams(streamList = this.getMediaStreamList()) {
    return streamList.every(stream => stream.local);
  }

  goToInfoTab() {
    this.props.switchToTab(1);
  }

  handleScreenShareClick() {
    const { screenSharingStreamState } = this.props;
    if (screenSharingStreamState.status === status.CONNECTED ||
      screenSharingStreamState.status === status.TRYING_TO_CONNECT) {
      this.props.roomAPI.stopScreenShare();
      return;
    }

    this.props.roomAPI.shareScreen();
  }

  renderControls() {
    const { primaryMediaStreamState, screenSharingStreamState } = this.props;
    const primaryMediaStreamConnected = primaryMediaStreamState.status === status.CONNECTED;
    const primaryMediaStreamConnecting =
      primaryMediaStreamState.status === status.TRYING_TO_CONNECT;
    const primaryMediaStreamError = primaryMediaStreamState.status === status.ERROR;
    const screenSharingStreamConnecting =
      screenSharingStreamState.status === status.TRYING_TO_CONNECT;
    const screenSharingStreamConnected = screenSharingStreamState.status === status.CONNECTED;
    const screenSharingStreamError = screenSharingStreamState.status === status.ERROR;

    const handleAudioVideoClick = (options = {}) => {
      const streamStatus = this.props.primaryMediaStreamState.status;
      if (streamStatus === status.DISCONNECTED || streamStatus === status.ERROR) {
        this.props.roomAPI.initializePrimaryMediaStream();
        return;
      }
      if (options.video) this.props.roomAPI.togglePrimaryMediaStreamVideo();
      if (options.audio) this.props.roomAPI.togglePrimaryMediaStreamAudio();
    };
    const controlButtons = [
      {
        name: 'add',
        icon: 'ion-ios-personadd',
        classNames: 'control',
        onClick: this.goToInfoTab,
      },
      {
        name: 'video',
        icon: 'ion-ios-videocam',
        classNames: classNames({
          control: true,
          video: true,
          loading: primaryMediaStreamConnecting,
          active: primaryMediaStreamState.video && primaryMediaStreamConnected,
          error: primaryMediaStreamError,
          muted: primaryMediaStreamState.mutedVideo,
        }),
        onClick: () => handleAudioVideoClick({ video: true }),
      },
      {
        name: 'mic',
        icon: primaryMediaStreamState.mutedAudio ? 'ion-ios-mic-off' : 'ion-ios-mic',
        classNames: classNames({
          control: true,
          mic: true,
          loading: primaryMediaStreamConnecting,
          active: primaryMediaStreamState.audio && primaryMediaStreamConnected,
          error: primaryMediaStreamError,
          muted: primaryMediaStreamState.mutedAudio,
        }),
        onClick: () => handleAudioVideoClick({ audio: true }),
      },
      {
        name: 'screenshare',
        icon: 'ion-ios-monitor',
        classNames: classNames({
          control: true,
          screen: true,
          loading: screenSharingStreamConnecting,
          active: screenSharingStreamConnected,
          error: screenSharingStreamError,
        }),
        onClick: this.handleScreenShareClick,
      },
    ];
    return (
      <div className={`controls ${this.state.idle ? 'hidden' : ''}`}>
        {controlButtons.map(control => (
          <div
            className={control.classNames}
            onClick={control.onClick}
            key={control.name}>
              <i className={`icon ${control.icon}`}></i>
          </div>
        ))}
      </div>
    );
  }

  renderLogo(loginService) {
    if (!loginService) return null;
    const service = this.services[loginService];
    const { color, icon } = service;
    return (
      <div className="" style={{ color }}>
        <i className={`icon custom-ion ${icon}`}></i>
      </div>
    );
  }

  renderFocussedStream(streamList) {
    const ownUserId = this.props.roomAPI.getUserId();
    const remoteStreams = streamList.filter(stream => stream.userId !== ownUserId);
    let { focussedStreamId } = this.state;
    const { pin, pinnedStreamId } = this.state;
    if (pin) focussedStreamId = pinnedStreamId;
    let focussedStream = focussedStreamId ? this.props.mediaStreams[focussedStreamId] : null;
    if (!focussedStream) focussedStream = remoteStreams[_.random(remoteStreams.length - 1)];

    const noVideo = !(focussedStream.video || focussedStream.screen) || focussedStream.mutedVideo;
    const userInfoCardClasses = classNames({
      userInfoCard: true,
      hidden: this.state.idle && !noVideo,
      positionCenter: noVideo,
      positionSidelines: !noVideo,
    });
    const user = this.props.roomAPI.getUserInfo(focussedStream.userId);
    return (
      <div className={`focussedStream ${noVideo ? 'empty' : ''}`}>
        {
          (focussedStream.video || focussedStream.screen) && !focussedStream.mutedVideo ?
          (<VideoStream streamSource={focussedStream.streamSource} muted='muted' autoPlay />) : null
        }
        <div className={userInfoCardClasses}>
          <Avatar user={user}></Avatar>
          <div className="name">
            {`${user.firstName} ${user.lastName ? user.lastName : ''}`}
          </div>
          <div className="loginService">
            { this.renderLogo(user.loginService) }
          </div>
        </div>
      </div>
    );
  }

  render() {
    const streamList = this.getMediaStreamList();
    const determineContent = () => {
      const userCount = this.props.connectedUsers.length;
      if (this.allLocalStreams(streamList)) {
        if (userCount <= 1) {
          return (
            <div className="header nobodyHere">
              <div className="text">
              {`It doesn't look like there is anyone ${userCount === 0 ? '' : ' else'} in the room `}
              </div>
              <button onClick = {this.goToInfoTab}
                type="button" className="pt-button pt-intent-success">
                Invite People <span className="hand">👋</span>
              </button>
            </div>
          );
        }

        return (
          <div className="header noMediaStreams">
            <div className="text">
              {"There doesn't seem to be any incoming video or audio feed"}
            </div>
          </div>
        );
      }
      if (!this.props.onTop) return null;
      return this.renderFocussedStream(streamList);
    };

    return (
      <div className={this.props.classNames} style={this.props.style}>
      {determineContent()}
      {this.renderControls()}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  mediaStreams: state.mediaStreams,
  streamSpeaking: state.streamSpeaking,
});

VideoChat.propTypes = tabPropTypes;

export default connect(mapStateToProps)(VideoChat);
