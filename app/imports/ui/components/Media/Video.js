/* global window */

import React, { Component } from 'react';

class VideoStream extends Component {

  constructor(props) {
    super(props);

    this.usingSrcObject = false;
  }
  componentDidMount() {
    try {
      this.videoElement.src = window.URL.createObjectURL(this.props.streamSource);
    } catch (e) {
      this.usingSrcObject = true;
      this.videoElement.srcObject = this.props.streamSource;
    }
  }

  componentDidUpdate() {
    if (this.usingSrcObject) {
      this.videoElement.srcObject = this.props.streamSource;
    }
  }

  componentWillUnmount() {
    if (!this.usingSrcObject) {
      URL.revokeObjectURL(this.videoElement.src);
    }
  }

  render() {
    return (
      <div className={this.props.videoClassNames} style={this.state} onClick={this.props.onClick}>
        <video
          autoPlay
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
  streamSource: React.PropTypes.object.isRequired,
  muted: React.PropTypes.string,
  videoClassNames: React.PropTypes.string,
  onClick: React.PropTypes.func,
};

export default VideoStream;

