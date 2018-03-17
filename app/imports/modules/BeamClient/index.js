import { Socket } from 'phoenix';

class BeamClient {
  constructor(beamHost, userToken, { onOpen, onError, onClose } = {}) {
    const socket = new Socket(
      `${beamHost}/socket`,
      {
        params: {
          user_token: userToken,
        },
        logger: (kind, message, data) => { console.log(`${kind}:${message}`, data); },
      },
    );
    if (onOpen) socket.onOpen(onOpen);
    if (onClose) socket.onClose(onClose);
    if (onError) socket.onError(onError);
    this.socket = socket;
    this.roomChannel = null;
    this.socket.connect();
  }

  joinRoomChannel({
    roomId,
    roomAccessToken,
    session,
    onJoin,
    onError,
    onClose,
    presenceStateHandler,
    presenceDiffHandler,
    onMessage,
  }) {
    const roomChannel = this.socket.channel(`room:${roomId}`, {
      room_token: roomAccessToken,
      session,
    });

    if (onError) roomChannel.onError(onError);
    if (onClose) roomChannel.onClose(onClose);

    roomChannel.on('new_msg', msg => onMessage(msg));
    roomChannel.on('presence_state', presenceStateHandler);
    roomChannel.on('presence_diff', presenceDiffHandler);

    this.roomChannel = roomChannel;
    this.roomChannel.join()
      .receive('ok', (resp) => {
        console.log('Joined successfully', resp);
        if (onJoin) onJoin();
      })
      .receive('error', (resp) => {
        console.log('Unable to join', resp);
      });
  }

  pushMessage(message) {
    this.roomChannel.push('new_msg', message);
  }
}

export default BeamClient;
