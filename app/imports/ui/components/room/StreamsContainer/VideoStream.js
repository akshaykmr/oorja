import React, { Component } from 'react';

class VideoStream extends Component {

  constructor(props) {
    super(props);

    this.state = {
      height: '100% !important',
      width: 'auto',
    };
  }

  setResizeListner() { // fail :/
    // this.videoElement.onresize = () => {
    //   if (this.unmountInProgress) return;
    //   const { clientWidth } = event.target;
    //   this.setState({
    //     ...this.state,
    //     width: clientWidth,
    //   });
    // };
  }

  componentWillUnmount() {
    this.unmountInProgress = true;
  }

  componentDidMount() {
    this.setResizeListner();
  }

  render() {
    return (
      <div className={this.props.videoClassNames} style={this.state} onClick={this.props.onClick}>
        <video
          src={this.props.streamSrc}
          autoPlay
          muted={this.props.muted}
          ref={(videoElement) => {
            this.videoElement = videoElement;
          }}>
        </video>
        <div
          className={this.props.indicatorClassNames}>
        </div>
      </div>
    );
  }
 }

VideoStream.propTypes = {
  streamSrc: React.PropTypes.string.isRequired,
  muted: React.PropTypes.string,
  videoClassNames: React.PropTypes.string,
  indicatorClassNames: React.PropTypes.string,
  onClick: React.PropTypes.func,
};

export default VideoStream;

