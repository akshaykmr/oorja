import _ from 'lodash';
import status from '../components/room/constants/status';

class RoomAPI {
  constructor(room) {
    // room will be directly accessible to whoever has a refernce to
    // this object, since there are no private properties in jaaavaascriipptt..
    this.room = room;
    this.messenger = room.messenger;
    this.activityListener = room.activityListener;
  }

  primaryDataStreamConnected() {
    return this.room.stateBuffer.primaryDataStreamStatus === status.CONNECTED;
  }

  getUserId() {
    return this.room.props.roomUserId;
  }

  getUserInfo(userId) {
    const { participants } = this.room.props.roomInfo;
    return _.find(participants, { userId });
  }

  sendMessage(message) {
    if (message.local) {
      this.messenger.recieve(message);
      return;
    }
    this.messenger.send(message);
  }

  addMessageHandler(tabId, handler) {
    /*
        tabId, handler
    */
    this.messenger.addMessageHandler(tabId, handler);
  }

  removeMessageHandler(tabId, handler) {
    /*
        tabId, handlerToBeRemoved
    */
    this.messenger.removeMessageHandler(tabId, handler);
  }

  addActivityListener(activity, listner) {
    this.room.activityListener.listen(activity, listner);
  }

  removeActivityListener() {

  }

  resizeStreamContainer(size) {
    this.room.updateState({
      streamContainerSize: { $set: size },
    });
  }
}

export default RoomAPI;
