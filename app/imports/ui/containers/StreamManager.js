/* global Erizo*/

// import status from '../components/room/constants/status';
// import streamTypes from '../components/room/constants/streamType';

class StreamManager {
  constructor(room) {
    this.room = room;
    this.erizoRoom = room.erizoRoom;
  }

  isLocalStream(stream) {
    return stream.getID() in this.erizoRoom.localStreams;
  }

}

export default StreamManager;
