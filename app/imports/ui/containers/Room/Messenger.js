import _ from 'lodash';
import messageType from '../../components/room/constants/messageType';

class Messenger {

  /* eg. message
    {
      type: // reqd. switching behavior for handling. from messageType.js
            // tabs must use messageType.TAB_MESSAGE
      from: // { userId, sessionId }  added by messenger.,
      to: [ {userId, sessionId}, ...]  required if not broadcast or local,
                                       if sessionId is not specified. all sessions of that
                                       particular userId will recieve the message.
      broadcast: bool,
      local: bool // process this message in our own room. ie. not sent to any other user or sesion.
      content: js obj.

      // specific keys for messageType.TAB_MESSAGE type message
      sourceTab: tabId  (required, could detect it automatically, but the simple logic
                          would be spread over closures. got to trust app code anyway),
      destinationTabs: [tabId, ...] (required),
    }

    full message object is passed on to the handlr function..
  */
  constructor(room, roomMessageHandler) {
    this.room = room;
    this.roomMessageHandler = roomMessageHandler;
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

  recieve(userId, sessionId, message) {
    /* eslint-disable no-param-reassign*/
    // get this data from stream attributes locally and append to the message
    // instead of having it being sent everytime.
    message.from = {
      userId,
      sessionId,
    };
    /* eslint-enable no-param-reassign*/
    const { messageHandlers } = this;
    const callHandlers = () => {
      const { ROOM_MESSAGE, TAB_MESSAGE } = messageType;
      switch (message.type) {
        case ROOM_MESSAGE:
          this.roomMessageHandler(message);
          break;
        case TAB_MESSAGE:
          message.destinationTabs.forEach((tabId) => {
            messageHandlers[tabId].forEach((handler) => {
              handler(message);
            });
          });
          break;
        default: console.error('unexpected message type');
      }
    };

    console.info('recieve message called', message);

    if (message.broadcast) {
      console.log('isBroadcast', message.broadcast);
      callHandlers();
      return;
    }
    const isRecepient = !!(_.find(message.to, { userId: this.room.roomAPI.getUserId() }));
    console.log('isRecepient');
    if (isRecepient) {
      callHandlers();
    }
  }

  send(message) {
    if (message.local) {
      this.recieve(
        this.room.roomAPI.getUserId(),
        this.room.sessionId,
        message
      );
      return;
    }

    if (message.broadcast) {
      this.room.dataBroadcastStream.sendData(message);
      return;
    }

    message.to.forEach((recepient) => {
      if (!recepient.sessionId) {
        // send to all sessions of this user.
        Object.keys(this.room.outgoingDataStreams[recepient.userId])
          .map(sessionId => this.room.outgoingDataStreams[recepient.userId][sessionId])
          .forEach((p2pStream) => {
            p2pStream.sendData(message);
          });
      } else {
        const p2pStream = this.room.outgoingDataStreams[recepient.userId][recepient.sessionId];
        p2pStream.sendData(message);
      }
    });
  }
}

export default Messenger;
