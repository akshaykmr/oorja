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
    const { messageHandlers } = this;
    const callHandlers = () => {
      // probably would want to add more logic here for different message types later.
      message.destinationTabs.forEach((tabId) => {
        messageHandlers[tabId].forEach((handler) => {
          handler(message);
        });
      });
    };

    console.info('recieve message called');
    console.log(message);

    if (message.broadcast) {
      console.log('isBroadcast', message.broadcast);
      callHandlers();
      return;
    }
    const isRecepient = message.to.indexOf(this.room.roomAPI.getUserId()) > -1;
    console.log('isRecepient', isRecepient);
    if (isRecepient) {
      callHandlers();
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
