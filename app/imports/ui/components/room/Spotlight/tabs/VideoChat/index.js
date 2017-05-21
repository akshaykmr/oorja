import React, { Component } from 'react';
import { connect } from 'react-redux';
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';
import _ from 'lodash';
// import uiConfig from '../../../constants/uiConfig';

// import Avatar from '../../../Avatar';
import classNames from 'classnames';

import tabPropTypes from '../tabPropTypes';
import status from '../../../constants/status';
import './videoChat.scss';

class VideoChat extends Component {

  constructor(props) {
    super(props);

    this.state = {
      pinnedStream: false,
      focussedStreamId: null,
    };

    this.goToInfoTab = this.goToInfoTab.bind(this);
    this.handleScreenShareClick = this.handleScreenShareClick.bind(this);
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
      <div className="controls">
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

  renderFocussedStream(streamList) {
    if (streamList.length === 0) return null;
    const { focussedStreamId } = this.state;
    const focussedStream = focussedStreamId ?
      this.props.mediaStreams[focussedStreamId] : streamList[_.random(streamList.length - 1)];
    return (
      <div className="focussedStream">
        {
          focussedStream.video || focussedStream.screen ?
          (
            <video
              src={focussedStream.streamSrc}
              muted='muted'
              autoPlay>
            </video>
          ) : null
        }
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
              <div className="text">It doesn't look like there is anyone
               {userCount === 0 ? '' : ' else'} in the room
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
            <div className="text">There doesn't seem to be any incoming video or audio feed</div>
          </div>
        );
      }
      return this.renderFocussedStream(streamList);
    };

    return (
      <div className={this.props.classNames} style={this.props.style}>
      <CSSTransitionGroup
        transitionName="fade"
        transitionAppear={true}
        transitionAppearTimeout={500}
        transitionEnterTimeout={500}
        transitionLeaveTimeout={300}>
        {determineContent()}
      </CSSTransitionGroup>
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
