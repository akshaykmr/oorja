/* global Erizo, URL */
import React, { Component } from 'react';
import update from 'immutability-helper';
import hark from 'hark';

import JoinRoomForm from '../../../containers/JoinRoomForm';
import './gettingReady.scss';

export default class GettingReady extends Component {
  constructor(props) {
    super(props);

    this.configureStream();
    this.state = this.getDefaultState();
    this.stateBuffer = this.state;
  }

  updateState(changes, buffer = this.stateBuffer) {
    this.stateBuffer = update(buffer, changes);
    this.setState(this.stateBuffer);
  }

  getDefaultState() {
    return {
      initialized: false,
      accessAccepted: true,
      streamSrc: '',
      streamError: false,
      errorReason: '',
      speaking: false,
    };
  }

  configureStream() {
    const erizoStream = Erizo.Stream({ video: true, audio: true, videoSize: [320, 240, 640, 480] });
    erizoStream.addEventListener('access-accepted', () => {
      const streamSrc = URL.createObjectURL(this.erizoStream.stream);
      this.updateState({
        initialized: { $set: true },
        accessAccepted: { $set: true },
        streamError: { $set: false },
        streamSrc: { $set: streamSrc },
      });
      const speechEvents = hark(this.erizoStream.stream);

      speechEvents.on('speaking', () => {
        this.updateState({
          speaking: { $set: true },
        });
      });

      speechEvents.on('stopped_speaking', () => {
        this.updateState({
          speaking: { $set: false },
        });
      });
      this.speechEvents = speechEvents;
    });
    erizoStream.addEventListener('access-denied', () => {
      this.updateState({
        initialized: { $set: true },
        accessAccepted: { $set: false },
        streamError: { $set: true },
        errorReason: { $set: 'Could not access your webcam and/or microphone' },
      });
    });
    erizoStream.addEventListener('stream-ended', () => {
      this.updateState({
        initialized: { $set: true },
        streamError: { $set: true },
        errorReason: { $set: 'Something went wrong :/' },
      });
      this.speechEvents.stop();
    });

    this.erizoStream = erizoStream;
  }

  componentDidMount() {
    this.erizoStream.init();
  }

  componentWillUnmount() {
    if (this.stateBuffer.initialized && !this.stateBuffer.streamError) {
      this.speechEvents.stop();
      this.erizoStream.close();
    }
  }

  renderMediaPreview() {
    if (!this.state.initialized) return null;
    else if (!this.state.accessAccepted) {
      return (
        <div className="">
          Could not access media device, please check your browser settings.
          <br/>
          <br/>
          oorja uses some of the newest features in web browsers,
          which may not be supported by yours yet. Proceeding may result errorprone experience.
          <br/> <br/>
           please vist the room link using chrome or firefox for a better experience, thank you.
        </div>
      );
    } else if (this.state.streamError) {
      return (
        <div className="">{this.state.errorReason}</div>
      );
    }
    return (
      <div className="stream">
        <video src={this.state.streamSrc} autoPlay muted></video>
        <div
          className={`speakingIndicator ${this.state.speaking ? 'speaking' : ''}`}>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="page">
        <div className="mediaPreview">
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
