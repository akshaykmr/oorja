import roomMessageTypes from 'imports/modules/room/messageTypes';
import MediaPreferences from 'imports/modules/media/storage';
import messageType from '../../components/Room/constants/messageType';


// If Room class file gets too big. I should move stream handling over here.
// be careful of 'this' context when doing so future-me. Did you finish witcher 3 btw?


// be careful of autocomplete do not make typos such as muteAudio/mutedAudio
// TODO: refactor
class StreamManager {
  constructor(room) {
    this.room = room;
  }

  isLocalStream(stream) {
    return this.room.erizoRoom.localStreams.has(stream.getID());
  }

  getLocalStreamList() {
    return this.room.erizoRoom.localStreams.keys()
      .map(streamIdString => parseInt(streamIdString, 10))
      .map(streamId => this.room.erizoRoom.localStreams.get(streamId));
  }

  getLocalStreamById(streamId) {
    return this.room.erizoRoom.localStreams.get(streamId);
  }

  getRemoteStreamList() {
    return this.room.erizoRoom.remoteStreams.keys()
      .map(streamIdString => parseInt(streamIdString, 10))
      .map(streamId => this.room.erizoRoom.remoteStreams.get(streamId));
  }


  /* eslint-disable no-param-reassign */
  // NOTE mute unmute only for local streams as of now.
  muteBeforePublish(mediaStream, settings = {}) {
    const { mutedAudio, mutedVideo } = settings;
    if (mutedAudio) mediaStream.stream.getAudioTracks()[0].enabled = false;
    if (mutedVideo) mediaStream.stream.getVideoTracks()[0].enabled = false;
    this.room.updateState({
      primaryMediaStreamState: {
        mutedVideo: { $set: !!mutedVideo },
        mutedAudio: { $set: !!mutedAudio },
      },
    });
  }

  sendMuteUnmuteMessage(mediaStream, actionType) {
    this.room.roomAPI.sendMessage({
      type: messageType.ROOM_MESSAGE,
      broadcast: true,
      content: {
        type: roomMessageTypes[actionType],
        eventDetail: { streamId: mediaStream.getID() },
      },
    });

    this.saveMediaDeviceSettings(actionType);
  }

  saveMediaDeviceSettings(action) {
    const settings = MediaPreferences.get();
    if (!settings) return;
    const {
      MUTE_AUDIO, UNMUTE_AUDIO, MUTE_VIDEO, UNMUTE_VIDEO,
    } = roomMessageTypes;
    switch (action) {
      case MUTE_AUDIO: settings.mutedAudio = true;
        break;
      case UNMUTE_AUDIO: settings.mutedAudio = false;
        break;
      case MUTE_VIDEO: settings.mutedVideo = true;
        break;
      case UNMUTE_VIDEO: settings.mutedVideo = false;
        break;
      default:
    }
    MediaPreferences.save(settings);
  }

  muteVideo(mediaStream) {
    mediaStream.stream.getVideoTracks()[0].enabled = false;
    this.room.props.updateMediaStreams({
      [mediaStream.getID()]: {
        mutedVideo: { $set: true },
      },
    });
    mediaStream.setAttributes({
      ...mediaStream.getAttributes(),
      mutedVideo: true,
    });
    this.sendMuteUnmuteMessage(mediaStream, roomMessageTypes.MUTE_VIDEO);
  }

  unmuteVideo(mediaStream) {
    mediaStream.stream.getVideoTracks()[0].enabled = true;
    this.room.props.updateMediaStreams({
      [mediaStream.getID()]: {
        mutedVideo: { $set: false },
      },
    });
    mediaStream.setAttributes({
      ...mediaStream.getAttributes(),
      mutedVideo: false,
    });
    this.sendMuteUnmuteMessage(mediaStream, roomMessageTypes.UNMUTE_VIDEO);
  }

  muteAudio(mediaStream) {
    mediaStream.stream.getAudioTracks()[0].enabled = false;
    this.room.props.updateMediaStreams({
      [mediaStream.getID()]: {
        mutedAudio: { $set: true },
      },
    });
    mediaStream.setAttributes({
      ...mediaStream.getAttributes(),
      mutedAudio: true,
    });
    this.sendMuteUnmuteMessage(mediaStream, roomMessageTypes.MUTE_AUDIO);
  }

  unmuteAudio(mediaStream) {
    mediaStream.stream.getAudioTracks()[0].enabled = true;
    this.room.props.updateMediaStreams({
      [mediaStream.getID()]: {
        mutedAudio: { $set: false },
      },
    });
    mediaStream.setAttributes({
      ...mediaStream.getAttributes(),
      mutedAudio: false,
    });
    this.sendMuteUnmuteMessage(mediaStream, roomMessageTypes.UNMUTE_AUDIO);
  }
  /* eslint-enable no-param-reassign */
}

export default StreamManager;
