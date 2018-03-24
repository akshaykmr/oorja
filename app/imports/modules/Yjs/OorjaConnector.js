import AbstractConnector from './AbstractConnector';

import messageType from '../../ui/components/Room/constants/messageType';
import roomActivities from '../../ui/components/Room/constants/roomActivities';

class OorjaConnector extends AbstractConnector {
  constructor(yConfig, connectorOptions) {
    super(yConfig, connectorOptions);
    this.connectorOptions = connectorOptions;
    this.disconnectFromY = this.disconnectFromY.bind(this);

    const { roomAPI, tabInfo } = connectorOptions;
    const tabName = tabInfo.name;
    const ownSession = roomAPI.getSession();

    this.ownSession = ownSession;
    this.setUserId(ownSession);
    this.connectedSessions = new Set();

    roomAPI.addMessageHandler(tabInfo.tabId, (message) => {
      console.info(tabName, 'message recieved');
      this.receiveMessage(message.from.session, message.content);
    });

    roomAPI.addActivityListener(roomActivities.REMOTE_TAB_READY, ({ source, session }) => {
      if (source !== tabInfo.tabId || this.connectedSessions.has(session)) return;
      // send message to indicate that we are ready too
      this.connectorOptions.roomAPI.sendMessage({
        type: messageType.TAB_READY,
        source: connectorOptions.tabInfo.tabId,
        to: [{ session }],
      });

      if (this.connectedSessions.has(session)) return;
      this.connectedSessions.add(session);
      this.userJoined(session, 'slave');
      console.info(tabName, 'user joined');
    });

    roomAPI.addActivityListener(roomActivities.USER_LEFT, this.disconnectFromY);
    roomAPI.addActivityListener(roomActivities.USER_SESSION_REMOVED, this.disconnectFromY);

    this.connectorOptions.roomAPI.sendMessage({
      type: messageType.TAB_READY,
      source: connectorOptions.tabInfo.tabId,
      broadcast: true,
    });
  }

  disconnectFromY({ session }) {
    if (this.connectedSessions.has(session)) {
      this.userLeft(session);
    }
    this.connectedSessions.delete(session);
  }

  send(recieverId, content) {
    const { connectorOptions } = this;
    const { tabId, name } = connectorOptions.tabInfo; // our own tab
    const message = {
      type: messageType.TAB_MESSAGE,
      source: tabId,
      destinationTabs: [tabId],
      local: recieverId === this.ownSession,
      to: [{ session: recieverId }],
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
      source: tabId,
      destinationTabs: [tabId],
      broadcast: true,
      content,
    };
    console.info(name, 'broadcasting message');
    connectorOptions.roomAPI.sendMessage(message);
  }
}

export default OorjaConnector;
