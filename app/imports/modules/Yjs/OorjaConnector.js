import AbstractConnector from './AbstractConnector';

import messageType from '../../ui/components/room/constants/messageType';
import roomActivities from '../../ui/components/room/constants/roomActivities';

class OorjaConnector extends AbstractConnector {
  constructor(yConfig, connectorOptions) {
    super(yConfig, connectorOptions);
    this.connectorOptions = connectorOptions;
    const { roomAPI, connectedUsers, tabInfo } = connectorOptions;
    const tabName = tabInfo.name;

    const ownSessionId = roomAPI.getSessionId();
    this.ownSessionId = ownSessionId;
    this.setUserId(ownSessionId);
    const self = this;
    this.addressBook = {};

    const yUserJoined = ({ sessionId }) => {
      if (sessionId === ownSessionId) return;
      this.addressBook[sessionId] = this.unpackIdentifier(sessionId);
      self.userJoined(sessionId, 'slave');
      console.info(tabName, 'user joined');
    };
    connectedUsers.forEach((user) => {
      user.sessionList.forEach((sessionId) => {
        yUserJoined({ sessionId });
      });
    });

    roomAPI.addActivityListener(roomActivities.USER_JOINED, yUserJoined);

    roomAPI.addActivityListener(roomActivities.USER_SESSION_ADDED, yUserJoined);

    const yUserLeft = ({ sessionId }) => {
      console.info(tabName, 'user left');
      self.userLeft(sessionId);
    };
    roomAPI.addActivityListener(roomActivities.USER_LEFT, yUserLeft);
    roomAPI.addActivityListener(roomActivities.USER_SESSION_REMOVED, yUserLeft);

    roomAPI.addMessageHandler(tabInfo.tabId, (message) => {
      console.info(tabName, 'message recieved');
      self.receiveMessage(message.from.sessionId, message.content);
    });
  }

  unpackIdentifier(sessionId) {
    const split = sessionId.split(':');
    return {
      userId: split[0],
      sessionId,
    };
  }

  disconnect() {
    super.disconnect();
  }
  reconnect() {
    super.reconnect();
  }

  send(recieverId, content) {
    const { connectorOptions } = this;
    const { tabId, name } = connectorOptions.tabInfo; // our own tab
    const message = {
      type: messageType.TAB_MESSAGE,
      sourceTab: tabId,
      destinationTabs: [tabId],
      local: recieverId === this.ownSessionId,
      to: [this.addressBook[recieverId]],
      content,
    };
    console.info(name, 'sending message', message);
    connectorOptions.roomAPI.sendMessage(message);
  }

  broadcast(content) {
    const { connectorOptions } = this;
    const { tabId, name } = connectorOptions.tabInfo; // our own tab
    const message = {
      type: messageType.TAB_MESSAGE,
      sourceTab: tabId,
      destinationTabs: [tabId],
      broadcast: true,
      content,
    };
    console.info(name, 'broadcasting message');
    connectorOptions.roomAPI.sendMessage(message);
  }

  isDisconnected() {
    return false;
  }
}

export default OorjaConnector;
