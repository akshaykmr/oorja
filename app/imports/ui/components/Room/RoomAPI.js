import { Meteor } from 'meteor/meteor';
import _ from 'lodash';
import roomActivities from '../../components/Room/constants/roomActivities';
import status from '../../components/Room/constants/status';

class RoomAPI {
  constructor(room) {
    // room will be directly accessible to whoever has a refernce to
    // this object, since there are no private properties in javascript. hmm...
    this.room = room;
    this.messenger = room.messenger;
    this.activityListener = room.activityListener;


    // is there a better way to do this?
    // bind all methods as they may be invoked with different context such as onClick handler
    // things like this make me doubt If I'm doing something wrong
    this.getUserId = this.getUserId.bind(this);
    this.getSessionId = this.getSessionId.bind(this);
    this.getUserInfo = this.getUserInfo.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.shareScreen = this.shareScreen.bind(this);
    this.stopScreenShare = this.stopScreenShare.bind(this);
    this.addMessageHandler = this.addMessageHandler.bind(this);
    this.removeMessageHandler = this.removeMessageHandler.bind(this);
    this.addActivityListener = this.addActivityListener.bind(this);
    this.removeActivityListener = this.removeActivityListener.bind(this);
    this.initializePrimaryMediaStream = this.initializePrimaryMediaStream.bind(this);
    this.togglePrimaryMediaStreamVideo = this.togglePrimaryMediaStreamVideo.bind(this);
    this.togglePrimaryMediaStreamAudio = this.togglePrimaryMediaStreamAudio.bind(this);
    this.mutePrimaryMediaStreamAudio = this.mutePrimaryMediaStreamAudio.bind(this);
    this.unmutePrimaryMediaStreamAudio = this.unmutePrimaryMediaStreamAudio.bind(this);
    this.mutePrimaryMediaStreamVideo = this.mutePrimaryMediaStreamVideo.bind(this);
    this.unmutePrimaryMediaStreamVideo = this.unmutePrimaryMediaStreamVideo.bind(this);
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


  // get list of active tabs (marked as ready by remote user)
  // takes sessionId, a user may have multiple sessions open. sessionId gives a
  // unique *user* identifier
  getActiveRemoteTabs(sessionId) {
    return this.room.activeRemoteTabsRegistry[sessionId];
  }

  sendMessage(message) {
    this.messenger.send(message);
  }

  shareScreen() {
    this.room.initializeScreenSharingStream();
  }

  stopScreenShare() {
    if (this.room.screenSharingStream) {
      this.room.stopScreenSharingStream();
    }
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


  // stream related

  initializePrimaryMediaStream() {
    const streamStatus = this.room.state.primaryMediaStreamState.status;
    if (streamStatus === status.CONNECTED || streamStatus === status.TRYING_TO_CONNECT) {
      return;
    }
    this.room.initializePrimaryMediaStream();
  }

  togglePrimaryMediaStreamVideo() {
    if (this.room.state.primaryMediaStreamState.mutedVideo) {
      this.unmutePrimaryMediaStreamVideo();
      return;
    }
    this.mutePrimaryMediaStreamVideo();
  }

  togglePrimaryMediaStreamAudio() {
    if (this.room.state.primaryMediaStreamState.mutedAudio) {
      this.unmutePrimaryMediaStreamAudio();
      return;
    }
    this.mutePrimaryMediaStreamAudio();
  }

  mutePrimaryMediaStreamAudio() {
    this.room.updateState({
      primaryMediaStreamState: {
        mutedAudio: { $set: true },
      },
    });
    this.room.streamManager.muteAudio(this.room.primaryMediaStream);
  }

  unmutePrimaryMediaStreamAudio() {
    this.room.updateState({
      primaryMediaStreamState: {
        mutedAudio: { $set: false },
      },
    });
    this.room.streamManager.unmuteAudio(this.room.primaryMediaStream);
  }

  mutePrimaryMediaStreamVideo() {
    this.room.updateState({
      primaryMediaStreamState: {
        mutedVideo: { $set: true },
      },
    });
    this.room.streamManager.muteVideo(this.room.primaryMediaStream);
  }

  unmutePrimaryMediaStreamVideo() {
    this.room.updateState({
      primaryMediaStreamState: {
        mutedVideo: { $set: false },
      },
    });
    this.room.streamManager.unmuteVideo(this.room.primaryMediaStream);
  }
}

export default RoomAPI;
