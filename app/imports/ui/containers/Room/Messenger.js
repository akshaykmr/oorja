class Messenger {
/*
  this class is responsible for delivering messages between tabs.
  recepient tabs may be local(if message.local is true) or remote.
  eg. message
  {
    type: // switching behavior for handling. will probably add this later.
    from: userId,
    to: [userId, ...],
    sourceTab: tabId,
    destinationTabs: [tabId, ...],
    broadcast: bool,
    local: bool
    content: js obj.
  }

  currently each peer publishes a broadcast stream (primaryDataStream) and every peer subscribes to
  another peers primaryDataStream, for a total of n such streams.
  message is sent to all the peers in the room even if a userId isn't in "to" field of the message.
  then, upon recieving the message, reciever discards the message if it doesn't find it's own userId
  in the "to" field. i.e. reciever only processes the message if it has its own userId
  specified in "to" field, or the message is a broadcast.

  another way would be for each peer to publish 1 stream for every other peer.
  this way irrelevant data is not sent to other peers.
  (n-1) streams eminating from one peer, and total of n*(n-1) such streams in
  a room.

  I dont know which one is better tbh.

  current approach is wasteful, but easy to manage.

  second approach could be a hassle juggling streams and their event handlers for errors etc.
  also, as per current implementation same userId can have multiple sessions open;
  selectively subscribing streams would be another problem to solve.

  should probaly ask licode guys. In any case, the implementation could be changed here later
  with minimal side effects(I hope).
  TODO: create a branch to try out other approach.
*/

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

    console.info('recieve message called', message);

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
