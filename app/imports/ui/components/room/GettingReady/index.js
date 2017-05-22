/* global Erizo, URL */
import React, { Component } from 'react';
import update from 'immutability-helper';
import classNames from 'classnames';
import { Button, Intent } from '@blueprintjs/core';
import hark from 'hark';

import SupremeToaster from '../../Toaster';

import JoinRoomForm from '../../../containers/JoinRoomForm';
import './gettingReady.scss';

export default class GettingReady extends Component {
  constructor(props) {
    super(props);

    this.configureStream();
    this.state = this.getDefaultState();
    this.stateBuffer = this.state;

    this.retryStreamInitialization = this.retryStreamInitialization.bind(this);
    this.muteAudio = this.muteAudio.bind(this);
    this.muteVideo = this.muteVideo.bind(this);
    this.unmuteAudio = this.unmuteAudio.bind(this);
    this.unmuteVideo = this.unmuteVideo.bind(this);
  }

  updateState(changes, buffer = this.stateBuffer) {
    this.stateBuffer = update(buffer, changes);
    this.setState(this.stateBuffer);
  }

  getDefaultState() {
    return {
      initialized: false,
      accessAccepted: false,
      audio: false,
      video: false,
      mutedAudio: false,
      mutedVideo: false,
      streamSrc: '',
      streamError: false,
      errorReason: '',
      speaking: false,
      spokenOnce: false,
    };
  }

  muteAudio() {
    this.erizoStream.stream.getAudioTracks()[0].enabled = false;
    this.updateState({
      mutedAudio: { $set: true },
    });
  }

  unmuteAudio() {
    this.erizoStream.stream.getAudioTracks()[0].enabled = true;
    this.updateState({
      mutedAudio: { $set: false },
    });
  }

  muteVideo() {
    this.erizoStream.stream.getVideoTracks()[0].enabled = false;
    this.updateState({
      mutedVideo: { $set: true },
    });
  }

  unmuteVideo() {
    this.erizoStream.stream.getVideoTracks()[0].enabled = true;
    this.updateState({
      mutedVideo: { $set: false },
    });
  }

  configureStream(options = {}) {
    if (this.erizoStream) {
      this.erizoStream.close();
      this.speechEvents.stop();
    }
    const erizoStream = Erizo.Stream({
      video: true,
      audio: true,
      // videoSize: [1920, 1080, 1920, 1080],
    });
    erizoStream.addEventListener('access-accepted', () => {
      const streamSrc = URL.createObjectURL(this.erizoStream.stream);
      this.updateState({
        initialized: { $set: true },
        audio: { $set: erizoStream.stream.getAudioTracks().length > 0 },
        video: { $set: erizoStream.stream.getVideoTracks().length > 0 },
        accessAccepted: { $set: true },
        streamError: { $set: false },
        streamSrc: { $set: streamSrc },
      });
      console.log(erizoStream);
      const speechEvents = hark(this.erizoStream.stream);

      speechEvents.on('speaking', () => {
        this.updateState({
          speaking: { $set: true },
          spokenOnce: { $set: true },
        });
      });

      speechEvents.on('stopped_speaking', () => {
        this.updateState({
          speaking: { $set: false },
        });
      });
      this.speechEvents = speechEvents;
    });
    erizoStream.addEventListener('access-denied', (streamEvent) => {
      if (options.retryAttempt) {
        SupremeToaster.show({
          message: 'Sorry. Could not access camera or microphone',
          intent: Intent.WARNING,
        });
      }
      console.log(streamEvent);
      this.updateState({
        initialized: { $set: true },
        accessAccepted: { $set: false },
      });
      this.erizoStream = null;
    });
    erizoStream.addEventListener('stream-ended', (streamEvent) => {
      console.log(streamEvent);
      this.speechEvents.stop();
    });

    this.erizoStream = erizoStream;
  }

  componentDidMount() {
    // delay initializing stream so that user can se the initial message
    // and that the page doesn't immediately ask for camera access, which may
    // surprise the user visiting a shared link.
    setTimeout(() => this.erizoStream.init(), 2500);
  }

  componentWillUnmount() {
    if (this.erizoStream) {
      this.speechEvents.stop();
      this.erizoStream.close();
    }
  }

  retryStreamInitialization() {
    this.stateBuffer = this.getDefaultState();
    this.setState(this.stateBuffer);
    setTimeout(() => {
      this.configureStream({ retryAttempt: true });
      this.erizoStream.init();
    }, 2000);
  }

  renderVideoControlButtons() {
    const controlButtons = [
      {
        name: 'video',
        icon: 'ion-ios-videocam',
        classNames: classNames({
          control: true,
          video: true,
          active: this.state.video,
          muted: this.state.mutedVideo,
        }),
        onClick: () => {
          if (this.state.mutedVideo) this.unmuteVideo();
          else this.muteVideo();
        },
      },
      {
        name: 'mic',
        icon: this.state.mutedAudio ? 'ion-ios-mic-off' : 'ion-ios-mic',
        classNames: classNames({
          control: true,
          mic: true,
          active: this.state.audio,
          muted: this.state.mutedAudio,
        }),
        onClick: () => {
          if (this.state.mutedAudio) this.unmuteAudio();
          else this.muteAudio();
        },
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

  renderMicrophoneTest() {
    return (
      <div className={`pt-callout pt-intent-${this.state.spokenOnce ? 'success' : 'primary'}`}>
        <h5>
          <span className="status">Test your microphone</span>
          <i className="icon ion-ios-mic"></i>
        </h5>
        <span className={`status ${!this.state.speaking ? 'animate blink' : ''}`}>
          {
            this.state.speaking ? 'All good. You are audible 👍' : 'Say something...'
          }
        </span>
      </div>
    );
  }
  renderMediaPreview() {
    if (!this.state.initialized) {
      return (
        <div className="pt-callout">
          <h5>Get ready to join the room</h5>
          <div className="detail">
            <i className="icon ion-ios-videocam"></i>
            <span className="status animate blink">initializing camera and microphone</span>
            <i className="icon ion-ios-mic"></i>
          </div>
        </div>
      );
    } else if (!this.state.accessAccepted) {
      const retryButtonAttr = {
        type: 'button',
        text: 'Try Again ?',
        intent: Intent.WARNING,
        onClick: this.retryStreamInitialization,
      };
      return (
        <div className="pt-callout pt-intent-warning">
          <h5>Could not access camera or microphone 😕
            <Button {...retryButtonAttr} />
          </h5>
          <div className="detail">
            oorja uses some of the newest features in web browsers,
            Which may not be supported by yours yet. Proceeding will likely result in
            an errorprone experience.
            <br/> <br/>
            please vist the room link using Chrome or Firefox for a better experience, thank you.
          </div>
        </div>
      );
    } else if (this.state.video) {
      return (
        <div className="videoStream">
          <video src={this.state.streamSrc} autoPlay muted></video>
          {
            this.state.mutedVideo ?
            (
              <div className="videoMuteCover">
                { this.state.mutedAudio ?
                  (
                    <div className="pt-callout">
                      <div className="detail">
                        Camera and microphone muted
                      </div>
                    </div>
                  ) : this.renderMicrophoneTest()
                }
              </div>
            ) : null
          }
          <div className={`speakingIndicator ${this.state.speaking ? 'speaking' : ''}`} />
          {this.renderVideoControlButtons()}
        </div>
      );
    }
    // only audio stream
    return (
      <div className="audioStream">
        {this.renderMicrophoneTest()}
        <audio src={this.state.streamSrc} autoPlay muted></audio>
      </div>
    );
  }

  render() {
    return (
      <div className="page">
        <div className={`mediaPreview ${this.state.video ? 'hasVideo' : ''}`}>
          {this.renderMediaPreview()}
        </div>
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
