import { Meteor } from 'meteor/meteor';
import { browserHistory } from 'react-router';

import { Intent } from '@blueprintjs/core';
import SupremeToaster from '../components/Toaster';

import { Rooms } from '../../collections/common';

export const CREATE_ROOM = 'CREATE_ROOM';
export const JOINED_ROOM = 'JOINED_ROOM';

export const STORE_ROOM_SECRET = 'STORE_ROOM_SECRET';
export const DELETE_ROOM_SECRET = 'DELETE_ROOM_SECRET';

export const STORE_ROOM_ACCESS_TOKEN = 'STORE_ROOM_ACCESS_TOKEN';
export const DELETE_ROOM_ACCESS_TOKEN = 'DELETE_ROOM_ACCESS_TOKEN';

export const STORE_ERIZO_TOKEN = 'STORE_ERIZO_TOKEN';
export const DELETE_ERIZO_TOKEN = 'DELETE_ERIZO_TOKEN';

export const STORE_ROOM_USERID = 'STORE_ROOM_USERID';
export const DELETE_ROOM_USERID = 'STORE_ROOM_USERID';


export const GOT_ROOM_INFO = 'GOT_ROOM_INFO';
export const CHECK_PASSWORD = 'CHECK_PASSWORD';
export const JOIN_ROOM = 'JOIN_ROOM';
export const UNEXPECTED_AUTHENTICATION_ERROR = 'UNEXPECTED_AUTHENTICATION_ERROR';

const GENERIC_ERROR_MESSAGE = 'Something went wrong... ☹️';

export const deleteRoomSecret = (roomName) => {
  localStorage.removeItem(`roomSecret:${roomName}`);

  return {
    type: DELETE_ROOM_SECRET,
  };
};

export const storeRoomSecret = (roomName, roomSecret) => {
  localStorage.setItem(`roomSecret:${roomName}`, roomSecret);
  return {
    type: STORE_ROOM_SECRET,
  };
};


export const deleteRoomAccessToken = (roomName) => {
  localStorage.removeItem(`roomAccessToken:${roomName}`);

  return {
    type: DELETE_ROOM_ACCESS_TOKEN,
  };
};

export const storeRoomAccessToken = (roomName, accessToken) => {
  localStorage.setItem(`roomAccessToken:${roomName}`, accessToken);
  return {
    type: STORE_ROOM_ACCESS_TOKEN,
  };
};


export const storeErizoToken = (roomName, token) => {
  localStorage.setItem(`erizoToken:${roomName}`, token);
  return {
    type: STORE_ERIZO_TOKEN,
  };
};

export const deleteErizoToken = (roomName) => {
  localStorage.removeItem(`erizoToken:${roomName}`);
  return {
    type: DELETE_ERIZO_TOKEN,
  };
};

export const storeRoomUserId = (roomName, userId, userToken) => {
  localStorage.setItem(`roomUserId:${roomName}`, userId);
  if (userToken) {
    localStorage.setItem(`roomUserToken:${roomName}`, userToken);
  }
  return {
    type: STORE_ROOM_USERID,
  };
};

export const deleteRoomUserId = (roomName) => {
  localStorage.removeItem(`roomUserId:${roomName}`);
  localStorage.removeItem(`roomUserToken:${roomName}`);
  localStorage.removeItem(`roomReady:${roomName}`);
  return {
    type: DELETE_ROOM_USERID,
  };
};

const unexpectedError = ({ dispatch, error, roomName }) => {
  console.error(error);
  browserHistory.push('/');
  dispatch({
    type: UNEXPECTED_AUTHENTICATION_ERROR,
  });

  if (roomName) {
    deleteRoomSecret(roomName);
    deleteErizoToken(roomName);
    deleteRoomUserId(roomName);
    deleteRoomAccessToken(roomName);
  }
  SupremeToaster.show({
    message: GENERIC_ERROR_MESSAGE,
    intent: Intent.DANGER,
  });
};

// this action relies redux-thunk middleware.
// this short form is less readable but I'm going to keep it this way to remember it.
export const createRoom = roomSpecification =>
    dispatch =>
      Meteor.callPromise('createRoom', roomSpecification).then(
        (response) => {
          const { createdRoomName, roomSecret, passwordEnabled, roomAccessToken } = response;
          // its called createdRoomName because some minor changes may be done to
          // the name send by the client above.
          // store secret in localStorage
          dispatch({
            type: CREATE_ROOM,
            payload: { createdRoomName },
          });

          if (passwordEnabled) {
            dispatch(storeRoomAccessToken(createdRoomName, roomAccessToken));
          } else {
            dispatch(storeRoomSecret(createdRoomName, roomSecret));
          }
          return Promise.resolve(response);
        },
        error => Promise.reject(error)
      );


export const getRoomInfo = (roomName, userToken = null) => ({
  type: GOT_ROOM_INFO,
  payload: Meteor.callPromise('getRoomInfo', roomName, userToken),
});


export const checkPassword = (roomName, password) =>
  dispatch =>
    Meteor.callPromise('authenticatePassword', roomName, password).then(
      (roomAccessToken) => {
        dispatch({
          type: CHECK_PASSWORD,
          payload: {
            successful: !!roomAccessToken,
          },
        });
        if (roomAccessToken != null) {
          localStorage.setItem(`roomAccessToken:${roomName}`, roomAccessToken);
        }
        return Promise.resolve(roomAccessToken);
      },
      (error) => { unexpectedError({ dispatch, error, roomName }); },
    );


const getRoomCredentials = roomName =>
  ({
    roomSecret: localStorage.getItem(`roomSecret:${roomName}`) || '',
    roomAccessToken: localStorage.getItem(`roomAccessToken:${roomName}`) || '',
    userToken: localStorage.getItem(`roomUserToken:${roomName}`) || '',
  });

export const joinRoom = (roomId, name = '', textAvatarColor = '') =>
  (dispatch) => {
    const room = Rooms.findOne({ _id: roomId });
    if (!room) {
      unexpectedError(dispatch);
      return Promise.resolve();
    }
    const roomName = room.roomName;
    const credentials = getRoomCredentials(roomName);
    return Meteor.callPromise('joinRoom', roomId, credentials, name, textAvatarColor).then(
      ({ erizoToken, userId, newUserToken }) => {
        const action = storeErizoToken(roomName, erizoToken);
        Meteor.connection.setUserId(userId);
        dispatch(storeRoomUserId(roomName, userId, newUserToken));
        dispatch(action);
        dispatch({
          type: JOINED_ROOM,
        });
        return Promise.resolve({ erizoToken });
      },
      (error) => { unexpectedError({ dispatch, error, roomName }); },
    );
  };

export const addTab = (roomId, tabId) => {
  const room = Rooms.findOne({ _id: roomId });
  const credentials = getRoomCredentials(room.roomName);
  return Meteor.callPromise('addTab', room._id, credentials, tabId).then(
    () => Promise.resolve(),
    () => Promise.reject()
  );
};

