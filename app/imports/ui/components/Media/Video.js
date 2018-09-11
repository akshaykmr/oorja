import React, { Component } from 'react';
import PropTypes from 'prop-types';

class VideoStream extends Component {
  componentDidMount() {
    this.videoElement.srcObject = this.props.streamSource;
  }

  render() {
    return (
      <div className={this.props.videoClassNames} style={this.state} onClick={this.props.onClick}>
        <video
          autoPlay
          playsInline
          muted={this.props.muted}
          ref={(videoElement) => {
            this.videoElement = videoElement;
          }}>
        </video>
      </div>
    );
  }
}

VideoStream.propTypes = {
  streamSource: PropTypes.object.isRequired,
  muted: PropTypes.string,
  videoClassNames: PropTypes.string,
  onClick: PropTypes.func,
};

export default VideoStream;

