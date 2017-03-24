import React, { Component } from 'react';

// import Y from '../../../../../../modules/Yjs';
import tabPropTypes from '../tabPropTypes';

import './chat.scss';

class Chat extends Component {

  constructor(props) {
    super(props);
    this.y = null;

    this.state = {
      initialSyncComplete: false,
    };
  }
  componentDidMount() {
    // const { roomAPI, connectedUsers, tabInfo, roomInfo } = this.props;
    // new Y({
    //   db: {
    //     name: 'indexeddb',
    //   },
    //   connector: {
    //     name: 'licodeConnector', // use webrtc connector
    //     room: `${this.props.roomInfo.roomName}:${tabInfo.name}`,
    //     role: 'slave',
    //     syncMethod: 'syncAll',
    //     roomAPI,
    //     connectedUsers,
    //     tabInfo,
    //     roomInfo,
    //   },
    //   share: {
    //     chat: 'Array',
    //   },
    // }).then((y) => {
    //   this.y = y;

    //   y.connector.whenSynced(() => {
    //     this.setState({
    //       ...this.state,
    //       // synced with atleast one user. not called when no other user in the room.
    //       initialSyncComplete: true,
    //     });
    //     console.info(tabInfo.name, 'synced');
    //   });
    // });
  }

  componentWillUnmount() {
    this.y.close();
  }

  render() {
    return (
      <div className={this.props.classNames} style={this.props.style}>
        <ul className="chat-thread">
          <li>Are we meeting today?</li>
          <li>yes, what time suits you?</li>
          <li>I was thinking after lunch, I have a meeting in the morning</li>
          <li>Are we meeting today?</li>
          <li>yes, what time suits you?</li>
          <li>I was thinking after lunch, I have a meeting in the morning</li>
          <li>Are we meeting today?</li>
          <li>yes, what time suits you?</li>
          <li>I was thinking after lunch, I have a meeting in the morning</li>
          <li>Are we meeting today?</li>
          <li>yes, what time suits you?</li>
          <li>I was thinking after lunch, I have a meeting in the morning</li>
          <li>Are we meeting today?</li>
          <li>yes, what time suits you?</li>
          <li>I was thinking after lunch, I have a meeting in the morning</li>
          <li>Are we meeting today?</li>
          <li>yes, what time suits you?</li>
          <li>I was thinking after lunch, I have a meeting in the morning</li>
        </ul>
        <form className="chat-input-form">
          <input className="chat-input"
                 name="chat-input"
                 placeholder= "Write a message..."
                 type="text"
                 autoComplete="off"
          />
        </form>
      </div>
    );
  }
}

Chat.propTypes = tabPropTypes;

export default Chat;
