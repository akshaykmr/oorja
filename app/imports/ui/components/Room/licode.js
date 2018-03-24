//  OLD CODE FOR reference.

setRoomStreamListners(erizoRoom = this.erizoRoom) {
  // when streams are added_to/removed_from the room
  erizoRoom.addEventListener('stream-added', (streamEvent) => {
    const { stream } = streamEvent;
    this.handleStreamSubscription(stream);
    console.info('stream added', streamEvent.stream.getAttributes());
  });

  erizoRoom.addEventListener('stream-subscribed', (streamEvent) => {
    console.info('stream subscribed', streamEvent.stream.getAttributes());
    this.handleStreamSubscriptionSucess(streamEvent.stream);
  });

  erizoRoom.addEventListener('stream-failed', (streamEvent) => {
    // so far none of the streams have failed. however it will definitely
    // be more likely in deployements
    console.error('Oi! stream failed', streamEvent, streamEvent.stream.getAttributes());
    // debugger
    // this.handleStreamRemoval(streamEvent.stream);
  });

  erizoRoom.addEventListener('stream-removed', (streamEvent) => {
    console.info('stream removed', streamEvent.stream.getAttributes());
    this.handleStreamRemoval(streamEvent.stream);
  });
}

setRoomConnectionListeners(erizoRoom = this.erizoRoom) {
  erizoRoom.addEventListener('room-connected', (roomEvent) => {
    console.info('room connected', roomEvent, erizoRoom);
  });

  erizoRoom.addEventListener('room-error', (roomEvent) => {
    console.error('room connection error', roomEvent);
  });

  erizoRoom.addEventListener('room-disconnected', (roomEvent) => {
    console.info('room disconnected', roomEvent);
    this.subscribedMediaStreams = {};
    // stop speechTrackers
    Object.keys(this.speechTrackers).forEach(streamId => this.speechTrackers[streamId].stop());
    this.speechTrackers = {};
    setTimeout(() => {
      this.tryToConnect();
    }, 1000);
  });
}


handleStreamSubscription(stream) {
  const attributes = stream.getAttributes();
  const user = _.find(this.props.roomInfo.participants, { userId: attributes.userId });
  if (!user) throw new Meteor.Error('stream publisher not found');

  const { MEDIA } = streamTypes;

  const subscribeMediaStream = () => {
    const streamId = stream.getID();
    // just a check If I run into this later
    if (this.subscribedMediaStreams[streamId]) { // stream already subscribed
      throw new Meteor.Error('over here!');
    }
    const isLocal = this.streamManager.isLocalStream(stream);
    if (isLocal) {
      if (attributes.purpose === mediaStreamPurpose.PRIMARY_MEDIA_STREAM) {
        this.updateState({
          primaryMediaStreamState: {
            status: { $set: status.CONNECTED },
          },
        });
        this.addSpeechTracker(this.primaryMediaStream);
      } else if (attributes.purpose === mediaStreamPurpose.SCREEN_SHARE_STREAM) {
        this.updateState({
          screenSharingStreamState: {
            status: { $set: status.CONNECTED },
          },
        });
      }
      console.info('adding local media stream');
    } else {
      if (user.userId === this.props.roomUserId) {
        // stream may be from a different session, do not subscribe.
        // probably best to ask users
        // return;
      }
      this.setIncomingStreamListners(stream);
      this.erizoRoom.subscribe(stream);
    }

    this.props.updateMediaStreams({
      [streamId]: {
        $set: this.formMediaStreamState(user, stream, attributes, isLocal),
      },
    });
    if (isLocal && stream.hasVideo()) {
      this.incrementVideoStreamCount();
    }
  };

  switch (attributes.type) {
    case MEDIA.BROADCAST:
    case MEDIA.P2P: subscribeMediaStream();
      break;
    default: console.error('unexpected stream type');
  }
}


handleStreamSubscriptionSucess(stream) {
  const attributes = stream.getAttributes();
  const user = _.find(this.props.roomInfo.participants, { userId: attributes.userId });
  const { DATA, MEDIA } = streamTypes;

  const handleMediaSubscriptionSuccess = () => {
    this.props.updateMediaStreams({
      [stream.getID()]: {
        status: { $set: status.CONNECTED },
        streamSource: { $set: stream.stream },
        audio: { $set: stream.stream.getAudioTracks().length > 0 },
        video: { $set: stream.stream.getVideoTracks().length > 0 },
      },
    });
    this.subscribedMediaStreams[stream.getID()] = stream;
    if (stream.hasVideo()) this.incrementVideoStreamCount();
  };

  switch (attributes.type) {
    case MEDIA.BROADCAST:
    case MEDIA.P2P:
      handleMediaSubscriptionSuccess();
      break;
    default: console.error('unexpected stream type');
  }
}

setIncomingStreamListners(stream) {
  const attributes = stream.getAttributes();
  const { DATA, MEDIA } = streamTypes;
  switch (attributes.type) {
    case DATA.BROADCAST:
      // set listners for data
      stream.addEventListener('stream-data', (streamEvent) => {
        this.messenger.recieve(attributes.userId, attributes.sessionId, streamEvent.msg);
      });
      stream.addEventListener('stream-attributes-update', () => {
        const updatedAttributes = stream.getAttributes();
        const previousActiveTabs = this.activeRemoteTabsRegistry[attributes.sessionId];
        const currentActiveTabs = updatedAttributes.activeTabs;
        const readyTabs = _.difference(currentActiveTabs, previousActiveTabs);
        this.activeRemoteTabsRegistry[attributes.sessionId] = currentActiveTabs;
        if (readyTabs.length > 1) console.warn('more than one tab ready', readyTabs);// just a check
        readyTabs.forEach((tabId) => {
          console.info('remote-tab-ready', attributes.sessionId, tabId);
          this.activityListener.dispatch(roomActivities.REMOTE_TAB_READY, {
            sessionId: attributes.sessionId,
            tabId,
          });
        });
      });
      break;
    case DATA.P2P:
      stream.addEventListener('stream-data', (streamEvent) => {
        this.messenger.recieve(attributes.userId, attributes.sessionId, streamEvent.msg);
      });
      break;
    case MEDIA.BROADCAST:
    case MEDIA.P2P:
      break;
    default: console.error('unexpected stream type');
  }
}

handleStreamRemoval(stream) {
  if (this.unmountInProgress) return;
  const attributes = stream.getAttributes();
  const isLocal = this.streamManager.isLocalStream(stream);
  const user = this.roomAPI.getUserInfo(attributes.userId);
  const { DATA, MEDIA } = streamTypes;

  if (isLocal) {
    console.warn('need to handle this case when I give that option to the user.');
    return;
  }

  const handleBroadcastStreamRemoval = () => {
    if (!this.subscribedDataStreams[stream.getID()]) {
      console.warn('stream was not subscribed earlier.');
      return;
    }
    // remove stream from subscribed streams
    delete this.subscribedDataStreams[stream.getID()];
    delete this.activeRemoteTabsRegistry[attributes.sessionId];
    this.updateUserConnection(user.userId, attributes.sessionId, true); // reset
  };

  switch (attributes.type) {
    case DATA.BROADCAST:
      handleBroadcastStreamRemoval();
      break;
    case DATA.P2P:
      // handleP2PStreamRemoval();
      break;
    case MEDIA.BROADCAST:
    case MEDIA.P2P:
      if (this.props.mediaStreams[stream.getID()].video) this.decrementVideoStreamCount();
      this.props.updateMediaStreams({
        $unset: [stream.getID()],
      });
      this.removeSpeechTracker(stream);
      this.subscribedMediaStreams[stream.getID()] = null;
      break;
    default: console.error('unexpected stream type');
  }

  if (this.streamManager.isLocalStream(stream)) {
    console.info('local stream removed');
  }
}

formMediaStreamState(user, stream, attributes, isLocal = false) {
  const streamId = stream.getID();
  const localStream = isLocal ? this.erizoRoom.localStreams.get(streamId) : null;
  const isScreenShare = attributes.purpose === mediaStreamPurpose.SCREEN_SHARE_STREAM;
  return {
    userId: user.userId,
    streamId,
    local: isLocal,
    type: attributes.type,
    purpose: attributes.purpose,
    // connected when stream subscription is successfull
    status: isLocal ? status.CONNECTED : status.TRYING_TO_CONNECT,
    audio: isLocal ? localStream.stream.getAudioTracks().length > 0 : stream.hasAudio(),
    video: isLocal ? localStream.stream.getVideoTracks().length > 0 : stream.hasVideo(),
    mutedAudio: !!attributes.mutedAudio,
    mutedVideo: !!attributes.mutedVideo,
    screen: isScreenShare,
    streamSource: isLocal ? localStream.stream : null,
    errorReason: '',
    warningReason: '',
  };
}
