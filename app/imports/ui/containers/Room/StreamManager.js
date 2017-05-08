/* global Erizo*/

// import status from '../components/room/constants/status';
// import streamTypes from '../components/room/constants/streamType';

// If Room class file gets too big. I should move stream handling over here.
// be careful of 'this' context when doing so future-me. Did you finish witcher 3 btw?

class StreamManager {
  constructor(room) {
    this.room = room;
  }

  isLocalStream(stream) {
    return stream.getID() in this.room.erizoRoom.localStreams;
  }

  getLocalStreamList() {
    return Object.keys(this.room.erizoRoom.localStreams)
            .map(streamIdString => Number(streamIdString))
            .map(streamId => this.room.erizoRoom.localStreams[streamId]);
  }

  getLocalStreamById(streamId) {
    return this.room.erizoRoom.localStreams[streamId];
  }

  getRemoteStreamList() {
    return Object.keys(this.room.erizoRoom.remoteStreams)
            .map(streamIdString => Number(streamIdString))
            .map(streamId => this.room.erizoRoom.remoteStreams[streamId]);
  }

}

export default StreamManager;
