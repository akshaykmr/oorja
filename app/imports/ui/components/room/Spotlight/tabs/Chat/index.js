import React, { Component } from 'react';
import classNames from 'classnames';

// import Y from '../../../../../../modules/Yjs';
import tabPropTypes from '../tabPropTypes';

import './chat.scss';

class Chat extends Component {

  constructor(props) {
    super(props);
    this.y = null;

    this.state = {
      initialSyncComplete: false,
      chatMessages: [
        {
          user: this.props.roomInfo.participants[0],
          text: 'Are we meeting today?',
        },
        {
          user: this.props.roomInfo.participants[1],
          text: 'nah dude',
        },
      ],
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
    const renderChatBubble = (chatMessage, index) => {
      const sender = chatMessage.user.userId === this.props.roomAPI.getUserId();
      const bubbleClassNames = {
        bubble: true,
        sent: sender,
        recepient: !sender,
      };
      const { user } = chatMessage;
      const avatarStyle = {
        backgroundImage: `url(${user.picture})`,
        backgroundColor: user.textAvatarColor,
      };
      return (
        <li className={classNames(bubbleClassNames)} key={index}>
          <div className="avatar" style={avatarStyle}>
            {user.picture ? '' : user.initials}
          </div>
          {chatMessage.text}
        </li>
      );
    };
    return (
      <div className={this.props.classNames} style={this.props.style}>
        <ul className="chat-thread">
          {this.state.chatMessages.map(renderChatBubble)}
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
