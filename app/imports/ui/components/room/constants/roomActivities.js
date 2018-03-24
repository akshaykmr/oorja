// activity types in a Room
// activity name, payload example
export default {

  ROOM_CONNECTED: 'ROOM_CONNECTED',
  ROOM_DISCONNECTED: 'ROOM_DISCONNECTED',
  ROOM_ERROR: 'ROOM_ERROR',

  USER_JOINED: 'USER_JOINED', // {user, session}
  USER_LEFT: 'USER_LEFT', // {user, session}
  USER_SESSION_ADDED: 'USER_SESSION_ADDED', // {user, session}
  USER_SESSION_REMOVED: 'USER_SESSION_REMOVED', // {user, session}

  REMOTE_TAB_READY: 'REMOTE_TAB_READY', // {session, tabId} TODO

  STREAM_SPEAKING_START: 'STREAM_SPEAKING_START', // { streamId, remote: bool }
  STREAM_SPEAKING_END: 'STREAM_SPEAKING_END', // { streamId, remote: bool }

  STREAM_CLICKED: 'STREAM_CLICKED', // streamId of video feed at the top
  USER_CLICKED: 'USER_CLICKED', // userId of the user avatar at the top

  TAB_SWITCH: 'TAB_SWITCH', // { from: tab_id, to: tab_id }
};
