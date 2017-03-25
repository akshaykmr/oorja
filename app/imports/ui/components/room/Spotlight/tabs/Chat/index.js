import { Meteor } from 'meteor/meteor';

import React, { Component } from 'react';
import classNames from 'classnames';
import update from 'immutability-helper';

import Y from '../../../../../../modules/Yjs';
import tabPropTypes from '../tabPropTypes';

import './chat.scss';

// Woah set state is async! Keep this in mind. and read the rtfm for avoiding headache lol.
// setState() does not immediately mutate this.state but creates a pending
// state transition. Accessing this.state after calling this method can potentially
// return the existing value. There is no guarantee of synchronous operation of
// calls to setState and calls may be batched for performance gains.

class Chat extends Component {

  constructor(props) {
    super(props);
    this.y = null;

    this.history = 50;

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChatInput = this.handleChatInput.bind(this);
    this.renderChatBubble = this.renderChatBubble.bind(this);
    this.cleanupChat = this.cleanupChat.bind(this);
    this.appendMessage = this.appendMessage.bind(this);
    this.removeMessage = this.removeMessage.bind(this);
    this.updateState = this.updateState.bind(this);

    this.state = {
      initialSyncComplete: false,
      chatInputValue: '',
      chatMessages: [],
    };

    this.stateBuffer = this.state;
  }

  updateState(changes, buffer = this.stateBuffer) {
    this.stateBuffer = update(buffer, changes);
    this.setState(this.stateBuffer);
  }

  componentDidMount() {
    const { roomAPI, connectedUsers, tabInfo, roomInfo } = this.props;
    new Y({
      db: {
        name: 'indexeddb',
      },
      connector: {
        name: 'licodeConnector',
        room: `${roomInfo.roomName}:${tabInfo.name}`,
        role: 'slave',
        syncMethod: 'syncAll',
        roomAPI,
        connectedUsers,
        tabInfo,
        roomInfo,
      },
      share: {
        chat: 'Array',
      },
    }).then((y) => {
      this.y = y;

      y.share.chat.observe((event) => {
        if (event.type === 'insert') {
          for (let i = 0; i < event.length; i++) {
            this.appendMessage(event.values[i], event.index);
          }
        } else if (event.type === 'delete') {
          for (let i = 0; i < event.length; i++) {
            this.removeMessage(event.index);
          }
        }
        // concurrent insertions may result in a history > this.history, so cleanup here
        this.cleanupChat();
      });

      y.connector.whenSynced(() => {
        this.updateState({ initialSyncComplete: { $set: true } });
        console.info(tabInfo.name, 'synced');
      });

      y.share.chat.toArray().forEach(this.appendMessage);
      this.cleanupChat();
    });
  }

  cleanupChat(y = this.y) {
    while (y.share.chat.length > this.history) {
      y.share.chat.delete(0);
    }
  }

  appendMessage(message, position) {
    console.info('appending message', position, message);
    const user = this.props.roomAPI.getUserInfo(message.userId);
    if (!user) throw new Meteor.Error('chat sender not found');

    const chatMessage = {
      user,
      text: message.text,
    };

    this.updateState({ chatMessages: { $splice: [[position, 0, chatMessage]] } });
  }

  removeMessage(position) {
    console.info('removing message', position);
    this.updateState({
      chatMessages: { $splice: [[position, 1]] },
    });
  }

  handleChatInput(event) {
    this.updateState({
      chatInputValue: { $set: event.target.value },
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    const { chatInputValue } = this.state;
    if (!chatInputValue || !this.y) return;

    const message = {
      userId: this.props.roomAPI.getUserId(),
      text: chatInputValue,
    };

    const y = this.y;
    this.updateState({
      chatInputValue: { $set: '' },
    });

    console.info('push called');
    y.share.chat.push([message]);
  }

  renderChatBubble(chatMessage, index) {
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

    // TODO: set a proper key.
    // Scroll chatbox on new message.
    return (
      <li className={classNames(bubbleClassNames)} key={index}>
        <div className="avatar" style={avatarStyle}>
          {user.picture ? '' : user.initials}
        </div>
        {chatMessage.text}
      </li>
    );
  }

  componentWillUnmount() {
    this.y.close();
  }

  render() {
    return (
      <div className={this.props.classNames} style={this.props.style}>
        <ul className="chat-thread">
          {this.state.chatMessages.map(this.renderChatBubble)}
        </ul>
        <form className="chat-input-form" onSubmit={this.handleSubmit}>
          <input className="chat-input"
                 name="chat-input"
                 placeholder= "Write a message..."
                 type="text"
                 autoComplete="off"
                 value={this.state.chatInputValue}
                 onChange={this.handleChatInput}
          />
        </form>
      </div>
    );
  }
}

Chat.propTypes = tabPropTypes;

export default Chat;
