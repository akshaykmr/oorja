
// If Room class file gets too big. I should move stream handling over here.
// be careful of 'this' context when doing so future-me. Did you finish witcher 3 btw?


// be careful of autocomplete do not make typos such as muteAudio/mutedAudio
class StreamManager {
  constructor(room) {
    this.room = room;
  }

  /* eslint-disable no-param-reassign*/
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
  }
  /* eslint-enable no-param-reassign*/

  isLocalStream(stream) {
    return stream.getID() in this.room.erizoRoom.localStreams;
  }

  getLocalStreamList() {
    return Object.keys(this.room.erizoRoom.localStreams)
            .map(streamId => this.room.erizoRoom.localStreams[streamId]);
  }

  getLocalStreamById(streamId) {
    return this.room.erizoRoom.localStreams[streamId];
  }

  getRemoteStreamList() {
    return Object.keys(this.room.erizoRoom.remoteStreams)
            .map(streamId => this.room.erizoRoom.remoteStreams[streamId]);
  }

}

export default StreamManager;
