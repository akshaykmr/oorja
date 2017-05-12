import { Meteor } from 'meteor/meteor';
import _ from 'lodash';
import roomActivities from '../../components/room/constants/roomActivities';

class RoomAPI {
  constructor(room) {
    // room will be directly accessible to whoever has a refernce to
    // this object, since there are no private properties in jaaavaascriipptt..
    this.room = room;
    this.messenger = room.messenger;
    this.activityListener = room.activityListener;
  }

  getUserId() {
    return this.room.props.roomUserId;
  }

  getSessionId() {
    return this.room.sessionId;
  }

  getUserInfo(userId) {
    const { participants } = this.room.props.roomInfo;
    return _.find(participants, { userId });
  }

  sendMessage(message) {
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
    if (!roomActivities[activity]) throw new Meteor.Error('Room activity not found.');
    this.room.activityListener.listen(activity, listner);
  }

  removeActivityListener(activity, listner) {
    this.room.activityListener.remove(activity, listner);
  }
}

export default RoomAPI;
