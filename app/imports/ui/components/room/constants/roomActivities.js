// activity types in a Room
// activity name, payload example
export default {
  USER_JOINED: 'USER_JOINED', // user, sessionId
  USER_LEFT: 'USER_LEFT', // user, sessionId
  USER_SESSION_ADDED: 'USER_SESSION_ADDED', // user, sessionId
  USER_SESSION_REMOVED: 'USER_SESSION_REMOVED', // user, sessionId


  STREAM_SPEAKING_START: 'STREAM_SPEAKING_START', // streamId, the stream is obviously a mediaStream
  STREAM_SPEAKING_END: 'STREAM_SPEAKING_END',

  TAB_SWITCH: 'TAB_SWITCH', // { from: tab_id, to: tab_id }
};
