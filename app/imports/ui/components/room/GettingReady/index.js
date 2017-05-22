/* global Erizo, URL */
import React, { Component } from 'react';
import update from 'immutability-helper';
import classNames from 'classnames';
import { Button, Intent, Popover, PopoverInteractionKind, Position } from '@blueprintjs/core';
import hark from 'hark';

import SupremeToaster from '../../Toaster';

import JoinRoomForm from '../../../containers/JoinRoomForm';
import './gettingReady.scss';

export default class GettingReady extends Component {
  constructor(props) {
    super(props);

    this.videoQualitySetting = {
      '240p': [320, 240, 480, 360],
      '360p': [480, 360, 640, 480],
      '480p': [640, 480, 1280, 720],
      '720p': [1280, 720, 1440, 900],
      '1080p': [1920, 1080, 2560, 1440],
    };
    this.state = this.getDefaultState();
    this.stateBuffer = this.state;
    this.configureStream();

    this.reinitializeStream = this.reinitializeStream.bind(this);
    this.muteAudio = this.muteAudio.bind(this);
    this.muteVideo = this.muteVideo.bind(this);
    this.unmuteAudio = this.unmuteAudio.bind(this);
    this.unmuteVideo = this.unmuteVideo.bind(this);
    this.handleVideoQualityChange = this.handleVideoQualityChange.bind(this);
  }

  updateState(changes, buffer = this.stateBuffer) {
    this.stateBuffer = update(buffer, changes);
    this.setState(this.stateBuffer);
  }

  saveMediaDeviceSettings() {
    const toBeSaved = [ // store these keys from state into local storage upon changes.
      'videoQuality',
      'lastGoodVideoQuality',
      'mutedAudio',
      'mutedVideo',
    ];

    /* eslint-disable no-param-reassign */
    const settings = toBeSaved
      .reduce((partialSettings, currentKey) => {
        partialSettings[currentKey] = this.stateBuffer[currentKey];
        return partialSettings;
      }, {});
    /* eslint-enable no-param-reassign */
    localStorage.setItem('mediaDeviceSettings', JSON.stringify(settings));
  }

  getDefaultState() {
    const savedSettings = JSON.parse(localStorage.getItem('mediaDeviceSettings'));
    return {
      videoQuality: savedSettings ? savedSettings.videoQuality : '480p',
      lastGoodVideoQuality: '240p',
      initialized: false,
      accessAccepted: false,
      audio: false,
      video: false,
      mutedAudio: savedSettings ? savedSettings.mutedAudio : false,
      mutedVideo: savedSettings ? savedSettings.mutedVideo : false,
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
    this.saveMediaDeviceSettings();
  }

  unmuteAudio() {
    this.erizoStream.stream.getAudioTracks()[0].enabled = true;
    this.updateState({
      mutedAudio: { $set: false },
    });
    this.saveMediaDeviceSettings();
  }

  muteVideo() {
    this.erizoStream.stream.getVideoTracks()[0].enabled = false;
    this.updateState({
      mutedVideo: { $set: true },
    });
    this.saveMediaDeviceSettings();
  }

  unmuteVideo() {
    this.erizoStream.stream.getVideoTracks()[0].enabled = true;
    this.updateState({
      mutedVideo: { $set: false },
    });
    this.saveMediaDeviceSettings();
  }

  configureStream(options = {}) {
    if (this.erizoStream) {
      this.erizoStream.close();
      this.speechEvents.stop();
    }
    const erizoStream = Erizo.Stream({
      video: true,
      audio: true,
      videoSize: this.videoQualitySetting[this.stateBuffer.videoQuality],
    });
    erizoStream.addEventListener('access-accepted', () => {
      const streamSrc = URL.createObjectURL(this.erizoStream.stream);
      this.updateState({
        initialized: { $set: true },
        audio: { $set: erizoStream.stream.getAudioTracks().length > 0 },
        video: { $set: erizoStream.stream.getVideoTracks().length > 0 },
        lastGoodVideoQuality: { $set: this.stateBuffer.videoQuality },
        accessAccepted: { $set: true },
        streamError: { $set: false },
        streamSrc: { $set: streamSrc },
      });
      this.saveMediaDeviceSettings();
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
      if (options.videoQualityChange) {
        SupremeToaster.show({
          message: 'Unable to change video quality',
          intent: Intent.WARNING,
        });
        this.updateState({
          accessAccepted: { $set: false },
          videoQuality: { $set: this.stateBuffer.lastGoodVideoQuality },
        });
        this.erizoStream = null;
        this.reinitializeStream();
        return;
      }
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

  handleVideoQualityChange(event) {
    this.updateState({
      videoQuality: { $set: event.target.value },
    });
    this.reinitializeStream({ videoQualityChange: true });
  }


  reinitializeStream(options = {}) {
    let delay = 0;
    if (options.retryAttempt) {
      this.stateBuffer = this.getDefaultState();
      this.setState(this.stateBuffer);
      delay = 2000;
    }
    setTimeout(() => {
      this.configureStream({
        retryAttempt: options.default,
        videoQualityChange: options.videoQualityChange,
      });
      this.erizoStream.init();
    }, delay);
  }

  renderVideoControlButtons() {
    const controlButtons = [
      {
        name: 'video',
        icon: 'ion-ios-videocam',
        classNames: classNames({
          control: true,
          video: true,
          error: !this.state.video,
          active: this.state.video,
          muted: this.state.mutedVideo,
        }),
        onClick: () => {
          if (!this.state.video) {
            SupremeToaster.show({
              message: 'no video found 😕',
              intent: Intent.WARNING,
            });
            return;
          }
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
          error: !this.state.audio,
          active: this.state.audio,
          muted: this.state.mutedAudio,
        }),
        onClick: () => {
          if (!this.state.audio) {
            SupremeToaster.show({
              message: 'no audio found 😕',
              intent: Intent.WARNING,
            });
            return;
          }
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
    const retryButtonAttr = {
      type: 'button',
      text: 'Try Again ?',
      intent: Intent.WARNING,
      onClick: () => { this.reinitializeStream({ retryAttempt: true }); },
    };
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
      return (
        <div className="pt-callout pt-intent-warning">
          <h5>Could not access camera or microphone
            <Button {...retryButtonAttr} />
          </h5>
          <div className="detail" style={{ textAlign: 'left' }}>
            <ul style={{ paddingLeft: '20px' }}>
            <li>It is possible that access to the devices has been blocked. If so
              please check your browser settings. You can always mute the devices if you
              do not need them</li>
            <li> oorja uses some of the newest features in web browsers,
             which may not be supported by yours yet.
             Vist the room link using Chrome or Firefox
            </li>
            </ul>
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
    } else if (this.state.audio) {
      return (
        <div className="audioStream">
          {this.renderMicrophoneTest()}
          <audio src={this.state.streamSrc} autoPlay muted></audio>
        </div>
      );
    }
    // access accepted but no video or audio
    return (
      <div>
        <div className="pt-callout" style={{ textAlign: 'center' }}>
          <div className="detail">
            Camera and microphone not found <br/>
          </div>
          <div><Button {...retryButtonAttr} /></div>
        </div>
      </div>
    );
  }

  renderInfoContent() {
    return (
      <div className="mediaPreviewPopoverContent">
        Test your camera and microphone before joining the room
        <div className="pt-callout pt-intent-primary" style={{ marginTop: '10px' }}>
          <h6>Tips</h6>
          <ul style={{ paddingLeft: '20px' }}>
            <li> Choose a high resolution video quality, else select
            low quality for more performance </li>
            <li> You may mute devices before joining the room and enable them
            later when needed</li>
          </ul>
        </div>
      </div>
    );
  }

  renderSettingContent() {
    return (
      <div className="mediaPreviewPopoverContent">
        <h6>Settings</h6> <br/>
        <label className="pt-label">
          Video quality
          <div className="pt-select">
            <select value={this.state.videoQuality} onChange={this.handleVideoQualityChange}>
              {Object.keys(this.videoQualitySetting).map((quality, index) => (
                <option key={index} value={quality}>{quality}</option>
              ))}
            </select>
          </div>
        </label>
      </div>
    );
  }

  renderPopovers() {
    return (
      <div className="popOverButtons">
        <Popover
            content={this.renderInfoContent()}
            interactionKind={PopoverInteractionKind.CLICK}
            popoverClassName="pt-popover-content-sizing"
            position={Position.LEFT_TOP}>
            <div className="information">
              <i className="icon ion-ios-help"></i>
            </div>
        </Popover>
        <Popover
            content={this.renderSettingContent()}
            interactionKind={PopoverInteractionKind.CLICK}
            popoverClassName="pt-popover-content-sizing"
            position={Position.LEFT_TOP}>
            <div className="settings">
              <i className="icon ion-ios-gear"></i>
            </div>
        </Popover>
      </div>
    );
  }

  render() {
    return (
      <div className="page">
        <div className={`mediaPreview ${this.state.video ? 'hasVideo' : ''}`}>
          {this.renderMediaPreview()}
          {this.renderPopovers()}
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
