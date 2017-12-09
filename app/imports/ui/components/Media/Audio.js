import React, { Component } from 'react';
import PropTypes from 'prop-types';

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
  streamSource: PropTypes.object.isRequired,
  muted: PropTypes.string,
};

export default AudioStream;

