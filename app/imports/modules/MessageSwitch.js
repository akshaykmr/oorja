class MessageSwitch {
  constructor({ transform } = {}) {
    // messageType -> handler Map
    this.hub = {};

    this.transform = transform;
    this.registerHandler = this.registerHandler.bind(this);
    this.registerHandlers = this.registerHandlers.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
  }

  registerHandler({ messageType, handler }) {
    if (this.hub[messageType]) {
      throw new Error('Only one handler may be bound to a messageType');
    }
    this.hub[messageType] = handler;
    return this;
  }

  removeHandler(messageType) {
    delete this.hub[messageType];
    return this;
  }

  registerHandlers(handlerSpecsMap) {
    Object.entries(handlerSpecsMap).forEach(([messageType, handler]) => this.registerHandler({
      messageType,
      handler,
    }));
    return this;
  }

  handleMessage(messageRecieved) {
    const message = this.transform ? this.transform(messageRecieved) : messageRecieved;
    const handler = this.hub[message.type];
    if (!handler) throw new TypeError('handler for message not registered');
    handler(message);
  }
}

export default MessageSwitch;
