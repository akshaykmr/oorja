import React, { Component } from 'react';

class VideoStream extends Component {

  componentDidMount() {
    this.videoElement.srcObject = this.props.streamSource;
  }

  componentDidUpdate() {
    this.videoElement.srcObject = this.props.streamSource;
  }

  renderSpeechIndicator() {
    if (!this.props.showSpeechIndicator) {
      return null;
    }
    return (
      <div
        className={this.props.indicatorClassNames}>
      </div>
    );
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
        {this.renderSpeechIndicator()}
      </div>
    );
  }
 }

VideoStream.propTypes = {
  streamSource: React.PropTypes.object.isRequired,
  muted: React.PropTypes.string,
  videoClassNames: React.PropTypes.string,
  indicatorClassNames: React.PropTypes.string,
  onClick: React.PropTypes.func,
  showSpeechIndicator: React.PropTypes.bool,
};

export default VideoStream;

