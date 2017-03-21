class Messenger {
  constructor(room) {
    this.room = room;
    this.messageHandlers = {}; // tabId -> [handlerFunction, ...]
  }

  addMessageHandler(tabId, handler) {
    const { messageHandlers } = this;
    if (!messageHandlers[tabId]) {
      messageHandlers[tabId] = []; // messageHandler {tabId : [handlers, ...]}
    }
    messageHandlers[tabId].push(handler);
  }

  removeMessageHandler({ tabId, handlerToBeRemoved }) {
    this.messageHandlers[tabId] = this.messageHandlers[tabId]
      .filter(handler => handler !== handlerToBeRemoved);
  }

  recieve(message) {
    console.info('recieve message called');
    console.log(message);
    if (message.to.indexOf(this.room.roomAPI.getUserId()) > -1 || !message.to.length) {
      console.log('hehehrhehrehrhehhre');
      const { messageHandlers } = this;
      // probably would want to add more logic here for different message types later.
      message.destinationTabs.forEach((tabId) => {
        messageHandlers[tabId].forEach((handler) => {
          handler(message);
        });
      });
    }
  }

  send(message) {
    if (message.local) {
      this.recieve(message);
      return;
    }
    this.room.primaryDataStream.sendData(message);
  }
}

export default Messenger;
