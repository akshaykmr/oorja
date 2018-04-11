
import React, { Component } from 'react';
import videoResolution from 'imports/modules/media/videoResolution';
import { mediaPreferences } from 'imports/modules/media/storage';
import update from 'immutability-helper';
import { Button, Intent } from '@blueprintjs/core';
import _ from 'lodash';
import { hasAudio, hasVideo, destroyMediaStream } from 'imports/modules/media/utils';
import hark from 'hark';

import VideoStream from 'imports/ui/components/media/Video';
import './webcamPreview.scss';

class WebcamPreview extends Component {
  constructor(props) {
    super(props);

    const savedVideoResolution = mediaPreferences.getVideoResolution();
    this.defaultVideoResolution = videoResolution.setting.VGA;

    this.stream = null;
    this.speechTracker = null;

    this.state = {
      audio: false,
      video: false,
      videoResolution: savedVideoResolution || this.defaultVideoResolution,
      initialized: false,
      audioInputDevices: [],
      videoInputDevices: [],
      selectedVideoInput: undefined,
      selectedAudioInput: undefined,
      accessAccepted: false,
      error: false,
      errorReason: '',
      speaking: false,
      spokenOnce: false,
    };

    this.handleVideoResolutionChange = this.handleVideoResolutionChange.bind(this);
    this.handleVideoInputChange = this.handleVideoInputChange.bind(this);
    this.handleAudioInputChange = this.handleAudioInputChange.bind(this);

    this.setMediaDevices = this.setMediaDevices.bind(this);
    this.stateBuffer = this.state;
  }

  updateState(changes, buffer = this.stateBuffer) {
    if (this.unmountInProgress) return;
    this.stateBuffer = update(buffer, changes);
    this.setState(this.stateBuffer);
  }

  trackMediaDevices() {
    this.mediaDeviceTracker = setInterval(() => {
      this.setMediaDevices();
    }, 3000);
  }

  setMediaDevices() {
    return new Promise((resolve, _reject) => navigator.mediaDevices.enumerateDevices()
      .then((mediaDevices) => {
        const audioInputDevices = mediaDevices
          .filter(device => device.kind === 'audioinput')
          .map(device => _.pick(device, ['deviceId', 'label']));

        const videoInputDevices = mediaDevices
          .filter(device => device.kind === 'videoinput')
          .map(device => _.pick(device, ['deviceId', 'label']));

        this.updateState({
          audioInputDevices: { $set: audioInputDevices },
          videoInputDevices: { $set: videoInputDevices },
        });
        resolve();
      }));
  }

  setInitialMediaDevices() {
    const { audioInputDevices, videoInputDevices } = this.stateBuffer;

    if (audioInputDevices.length) {
      const savedAudioInputDeviceId = mediaPreferences.getVoiceSource();
      const audioDeviceId = _.find(audioInputDevices, { deviceId: savedAudioInputDeviceId }) ?
        savedAudioInputDeviceId : audioInputDevices[0].deviceId;

      this.updateState({ selectedAudioInput: { $set: audioDeviceId } });
    }
    if (videoInputDevices.length) {
      const savedVideoInputDeviceId = mediaPreferences.getVideoSource();
      const videoDeviceId = _.find(videoInputDevices, { deviceId: savedVideoInputDeviceId }) ?
        savedVideoInputDeviceId : videoInputDevices[0].deviceId;

      this.updateState({ selectedVideoInput: { $set: videoDeviceId } });
    }
  }

  componentDidMount() {
    this.setMediaDevices()
      .then(() => {
        this.setInitialMediaDevices();
        this.initializeWebcam();
        this.trackMediaDevices();
      });
  }

  componentWillUnmount() {
    this.unmountInProgress = true;
    if (this.stream) {
      destroyMediaStream(this.stream);
    }
    if (this.speechTracker) {
      this.speechTracker.stop();
    }
  }

  resetErrors() {
    this.updateState({
      error: { $set: false },
      errorReason: { $set: '' },
      initialized: { $set: false },
    });
  }

  setupSpeechTracker(mediaStream) {
    const tracker = hark(mediaStream);
    tracker.on('speaking', () => {
      this.updateState({ speaking: { $set: true }, spokenOnce: { $set: true } });
    });
    tracker.on('stopped_speaking', () => {
      this.updateState({ speaking: { $set: false } });
    });
    this.speechTracker = tracker;
  }

  initializeWebcam() {
    this.updateState({
      initialized: { $set: false },
      speaking: { $set: false },
      spokenOnce: { $set: false },
    });
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    const { videoResolution: res } = this.stateBuffer;
    this.resetErrors();

    const { selectedVideoInput, selectedAudioInput } = this.stateBuffer;

    const audioConstraints = { audio: { deviceId: { exact: selectedAudioInput } } };
    const videoConstraints = {
      video: Object.assign(
        { deviceId: { exact: selectedVideoInput } },
        videoResolution.constraints[res],
      ),
    };

    const constraints = Object.assign(audioConstraints, videoConstraints);
    navigator.mediaDevices.getUserMedia(constraints)
      .then((mediaStream) => {
        this.stream = mediaStream;
        this.updateState({
          initialized: { $set: true },
          accessAccepted: { $set: true },
          audio: { $set: hasAudio(mediaStream) },
          video: { $set: hasVideo(mediaStream) },
        });
        if (this.speechTracker) {
          this.speechTracker.stop();
        }
        this.setupSpeechTracker(mediaStream);
      })
      .catch((e) => {
        this.stream = null;
        this.updateState({
          initialized: { $set: true },
          error: { $set: true },
          errorReason: { $set: e.name },
        });
      });
  }

  handleVideoResolutionChange(event) {
    const qualitySetting = event.target.value;
    this.updateState({ videoResolution: { $set: qualitySetting } });
    mediaPreferences.saveVideoResolution(qualitySetting);
    this.initializeWebcam();
  }

  handleVideoInputChange(event) {
    const deviceId = event.target.value;
    this.updateState({ selectedVideoInput: { $set: deviceId } });
    mediaPreferences.setVideoSource(deviceId);
    this.initializeWebcam();
  }

  handleAudioInputChange(event) {
    const deviceId = event.target.value;
    this.updateState({ selectedAudioInput: { $set: deviceId } });
    mediaPreferences.setVoiceSource(deviceId);
    this.initializeWebcam();
  }

  renderMicrophoneTest() {
    return (
      <div className={`audioPreview pt-callout pt-intent-${this.state.spokenOnce ? 'success' : 'primary'}`}>
        <div>
          { this.state.videoInputDevices.length > 0 ? 'Hmm.. we could only detect your microphone.' : '' }
        </div>
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
    if (this.state.video) {
      return (
        <div className={`videoStream ${this.state.speaking ? 'speaking' : ''}`}>
          <VideoStream streamSource={this.stream} muted='muted' autoPlay />
        </div>
      );
    } else if (this.state.audio) {
      return this.renderMicrophoneTest();
    }
    // access accepted but no video or audio
    return this.renderRetryCallout();
  }


  renderRetryCallout() {
    const retryButtonAttr = {
      type: 'button',
      text: 'Try Again ?',
      intent: Intent.WARNING,
      onClick: () => { this.initializeWebcam({ retryAttempt: true }); },
    };
    return (
      <div className="pt-callout pt-intent-warning">
        <h5> Could not access camera or microphone </h5>
        <Button {...retryButtonAttr} />
        <div className="detail" style={{ textAlign: 'left' }}>
          <ul style={{ paddingLeft: '20px' }}>
            { this.state.accessAccepted ? '' :
              <li>
                It is possible that access to the webcam was not granted. If so
                please check your browser settings.
              </li>
            }
            <li>
              Trying a different device or quality from the options below might help.
            </li>
          </ul>
        </div>
      </div>
    );
  }

  render() {
    const mediaPreview = () => {
      if (this.state.error) return this.renderRetryCallout();
      return this.renderMediaPreview();
    };
    return (
      <div className="webcamPreview">
        {
          this.state.initialized ?
            <div className="mediaPreview">
              { mediaPreview() }
            </div>
            :
            <div className="initializing"> Initializing </div>
        }

        <div className="settingControls">
          <div className="control">
            <span className="label"> Video quality </span>
            <select value={this.state.videoResolution} onChange={this.handleVideoResolutionChange}>
              {Object.entries(videoResolution.name).map(([quality, displayName], index) => (
                <option key={index} value={quality}>{displayName}</option>
              ))}
            </select>
          </div>
          <div className="control">
            <span className="label"> Video device </span>
            <select value={this.state.selectedVideoInput} onChange={this.handleVideoInputChange}>
              {this.state.videoInputDevices.map(({ deviceId, label }, index) => (
                <option key={index} value={deviceId}>{label}</option>
              ))}
            </select>
          </div>
          <div className="control">
            <span className="label"> Mic </span>
            <select value={this.state.selectedAudioInput} onChange={this.handleAudioInputChange}>
              {this.state.audioInputDevices.map(({ deviceId, label }, index) => (
                <option key={index} value={deviceId}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }
}

export default WebcamPreview;
