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


    roomAPI.addMessageHandler(tabInfo.tabId, (message) => {
      console.info(tabName, 'message recieved');
      self.receiveMessage(message.from.sessionId, message.content);
    });

    const connectToY = (sessionId) => {
      this.addressBook[sessionId] = this.unpackIdentifier(sessionId);
      self.userJoined(sessionId, 'slave');
      console.info(tabName, 'user joined');
    };

    const connectIfTabIsReady = ({ sessionId }) => {
      // connect user(sessionId) to Y if the the remote users tab is ready
      if (sessionId === ownSessionId) return;
      const activeTabs = roomAPI.getActiveRemoteTabs(sessionId);
      if (activeTabs.indexOf(tabInfo.tabId) !== -1) {
        connectToY(sessionId);
      }
    };

    connectedUsers.forEach((user) => {
      user.sessionList.forEach((sessionId) => {
        connectIfTabIsReady({ sessionId });
      });
    });

    roomAPI.addActivityListener(roomActivities.USER_JOINED, connectIfTabIsReady);
    roomAPI.addActivityListener(roomActivities.USER_SESSION_ADDED, connectIfTabIsReady);
    roomAPI.addActivityListener(roomActivities.REMOTE_TAB_READY, ({ tabId, sessionId }) => {
      if (tabId === tabInfo.tabId) connectToY(sessionId);
    });

    const disconnectFromY = ({ sessionId }) => {
      if (this.addressBook[sessionId]) {
        console.info(tabName, 'user left');
        self.userLeft(sessionId);
      }
      delete this.addressBook[sessionId];
    };
    roomAPI.addActivityListener(roomActivities.USER_LEFT, disconnectFromY);
    roomAPI.addActivityListener(roomActivities.USER_SESSION_REMOVED, disconnectFromY);
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
