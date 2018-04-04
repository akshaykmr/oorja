import _ from 'lodash';
import update from 'immutability-helper';
import * as mediaUtils from 'imports/modules/media/utils';
import messageType from '../../components/Room/constants/messageType';
import status from './constants/status';

class StreamManager {
  constructor(room) {
    this.room = room;
  }

  pushStreamUpdate(streamId, state) {
    this.room.sendMessage({
      broadcast: true,
      type: messageType.STREAM_UPDATE,
      content: {
        streamId,
        ...state,
      },
    });
  }

  handleStreamUpdate({
    streamId, mutedAudio, mutedVideo,
  }) {
    if (this.room.props.mediaStreams[streamId]) {
      this.room.props.updateMediaStreams({
        [streamId]: {
          mutedAudio: { $set: mutedAudio },
          mutedVideo: { $set: mutedVideo },
        },
      });
    }
  }

  getStreamList() {
    return Object.entries(this.room.props.mediaStreams)
      .map(([_streamId, streamState]) => streamState);
  }

  formMediaStreamState({ userId, mediaStream, isLocal = false }) {
    return {
      userId,
      streamId: mediaStream.id,
      local: isLocal,
      status: status.CONNECTED,
      audio: mediaUtils.hasAudio(mediaStream),
      video: mediaUtils.hasVideo(mediaStream),
      mutedAudio: mediaUtils.isAudioMuted(mediaStream),
      mutedVideo: mediaUtils.isVideoMuted(mediaStream),
      streamSource: mediaStream,
      errorReason: '',
      warningReason: '',
    };
  }

  updateStream(streamId, changeSet) {
    const streamState = this.room.props.mediaStreams[streamId];
    const newStreamState = update(streamState, changeSet);
    this.room.props.updateMediaStreams({
      [streamId]: { $set: newStreamState },
    });
    this.pushStreamUpdate(streamId, _.pick(newStreamState, ['mutedAudio', 'mutedVideo']));
  }

  muteVideo(mediaStream) {
    mediaUtils.muteVideoTracks(mediaStream);
    this.updateStream(mediaStream.id, { mutedVideo: { $set: true } });
  }

  unmuteVideo(mediaStream) {
    mediaUtils.unmuteVideoTracks(mediaStream);
    this.updateStream(mediaStream.id, { mutedVideo: { $set: false } });
  }

  muteAudio(mediaStream) {
    mediaUtils.muteAudioTracks(mediaStream);
    this.updateStream(mediaStream.id, { mutedAudio: { $set: true } });
  }

  unmuteAudio(mediaStream) {
    mediaUtils.unmuteAudioTracks(mediaStream);
    this.updateStream(mediaStream.id, { mutedAudio: { $set: false } });
  }
}

export default StreamManager;
