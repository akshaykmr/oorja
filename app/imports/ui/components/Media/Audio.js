import React, { Component } from 'react';

class AudioStream extends Component {

  componentDidMount() {
    this.audioElement.srcObject = this.props.streamSource;
  }

  componentDidUpdate() {
    this.audioElement.srcObject = this.props.streamSource;
  }

  render() {
    return (
      <audio
        autoPlay
        muted={this.props.muted}
        ref={(audioElement) => {
          this.audioElement = audioElement;
        }}>
      </audio>
    );
  }
 }

AudioStream.propTypes = {
  streamSource: React.PropTypes.object.isRequired,
  muted: React.PropTypes.string,
};

export default AudioStream;

