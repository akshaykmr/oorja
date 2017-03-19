class API {
  constructor(room) {
    this.room = room;
  }

  dispatchMessage(message) {
    this.room.primaryDataStream.sendData(message);
  }

  resizeStreamContainer(size) {
    this.room.setState({
      ...this.room.state,
      streamContainerSize: size,
    });
  }


}

export default API;
