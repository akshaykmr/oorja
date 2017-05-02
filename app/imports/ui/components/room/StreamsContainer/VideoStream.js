import React, { Component } from 'react';

class VideoStream extends Component {

  constructor(props) {
    super(props);

    this.state = {
      height: '100% !important',
      width: undefined,
    };
  }

  setResizeListner() { // fail :/
    this.videoElement.onresize = (event) => {
      if (this.unmountInProgress) return;
      const { clientWidth } = event.target;
      this.setState({
        ...this.state,
        width: clientWidth,
      });
    };
  }

  componentWillUnmount() {
    this.unmountInProgress = true;
  }

  componentDidMount() {
    this.setResizeListner();
  }

  render() {
    return (
      <div className="videoStream" style={this.state}>
        <video
          src={this.props.streamSrc}
          autoPlay
          muted={this.props.muted}
          ref={(videoElement) => {
            this.videoElement = videoElement;
          }}>
        </video>
        <div
          className={this.props.classNames}>
        </div>
      </div>
    );
  }
 }

VideoStream.propTypes = {
  streamSrc: React.PropTypes.string.isRequired,
  muted: React.PropTypes.string,
  classNames: React.PropTypes.string,
};

export default VideoStream;

