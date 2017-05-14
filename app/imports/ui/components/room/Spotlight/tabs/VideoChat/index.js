import React, { Component } from 'react';
import { connect } from 'react-redux';
// import uiConfig from '../../../constants/uiConfig';

// import Avatar from '../../../Avatar';


import tabPropTypes from '../tabPropTypes';
import './videoChat.scss';

class VideoChat extends Component {

  constructor(props) {
    super(props);


    this.state = {

    };
  }

  getMediaStreamList() {
    return Object.keys(this.props.mediaStreams)
      .map(streamId => this.props.mediaStreams[streamId]);
  }

  allLocalStreams(streamList = this.getMediaStreamList()) {
    return streamList.every(stream => stream.local);
  }

  render() {
    const streamList = this.getMediaStreamList();

    const determineContent = () => {
      if (this.allLocalStreams(streamList)) {
        const alone = this.props.connectedUsers.length <= 1;
        if (alone) {
          return (
            <div className="header nobodyHere">
              <div className="text">It doesn't look like there is anyone else in the room</div>
              <button onClick = {() => this.props.switchToTab(1)}
                type="button" className="pt-button pt-intent-success">
                Invite People 👋
              </button>
            </div>
          );
        }

        return (
          <div className="header noMediaStreams">
            <div className="text">There doesn't seem to be any incoming video or audio feed</div>
          </div>
        );
      }

      return null;
    };

    return (
      <div className={this.props.classNames} style={this.props.style}>
        {determineContent()}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  mediaStreams: state.mediaStreams,
  streamSpeaking: state.streamSpeaking,
});

VideoChat.propTypes = tabPropTypes;

export default connect(mapStateToProps)(VideoChat);
