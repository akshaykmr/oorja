import { Meteor } from 'meteor/meteor';
import { browserHistory } from 'react-router';

import { Intent } from '@blueprintjs/core';
import SupremeToaster from '../components/Toaster';

import { Rooms } from '../../collections/common';

export const CREATE_ROOM = 'CREATE_ROOM';
export const STORE_SECRET = 'STORE_SECRET';
export const DELETE_SECRET = 'DELETE_SECRET';
export const GOT_ROOM_INFO = 'GOT_ROOM_INFO';
export const CHECK_PASSWORD = 'CHECK_PASSWORD';
export const JOIN_ROOM = 'JOIN_ROOM';
export const UNEXPECTED_AUTHENTICATION_ERROR = 'UNEXPECTED_AUTHENTICATION_ERROR';

const GENERIC_ERROR_MESSAGE = 'Something went wrong... ¯\\(°_o)/¯';

const unexpectedError = ({ dispatch, message, error }) => {
  console.error(error);
  browserHistory.push('/');
  dispatch({
    type: UNEXPECTED_AUTHENTICATION_ERROR,
  });
  SupremeToaster.show({
    message: message || GENERIC_ERROR_MESSAGE,
    intent: Intent.DANGER,
  });
};

export const deleteSecret = (roomName) => {
  localStorage.removeItem(`roomSecret:${roomName}`);

  return {
    type: DELETE_SECRET,
  };
};

export const storeSecret = (roomName, roomSecret) => {
  localStorage.setItem(`roomSecret:${roomName}`, roomSecret);
  return {
    type: STORE_SECRET,
  };
};

// this action relies redux-thunk middleware.
export const createRoom = (roomName, passwordEnabled, password = '') =>
  (dispatch, getState) => {
    const roomInfo = {
      roomName,
      passwordEnabled,
      password,
      configuration: getState().roomConfiguration,
    };
    return Meteor.callPromise('createRoom', roomInfo).then(
      (response) => {
        const { createdRoomName, roomSecret } = response;
        // its called createdRoomName because some minor changes may be done to
        // the name send by the client above.
        // store secret in localStorage
        dispatch({
          type: CREATE_ROOM,
          payload: createdRoomName,
        });
        storeSecret(createdRoomName, roomSecret);
        return Promise.resolve(response);
      },
      error => Promise.reject(error)
    );
  };


export const getRoomInfo = roomName => ({
  type: GOT_ROOM_INFO,
  payload: Meteor.callPromise('getRoomInfo', roomName),
});


export const checkPassword = (roomName, password) =>
  dispatch =>
    Meteor.callPromise('authenticatePassword', roomName, password).then(
      (roomSecret) => {
        dispatch({
          type: CHECK_PASSWORD,
          payload: {
            successful: !!roomSecret,
          },
        });
        if (roomSecret != null) {
          localStorage.setItem(`roomSecret:${roomName}`, roomSecret);
        }
        return Promise.resolve(roomSecret);
      },
      (error) => { unexpectedError({ dispatch, error }); },
    );

export const joinRoom = (name, textAvatarColor) =>
  (dispatch) => {
    const room = Rooms.findOne();
    if (!room) {
      unexpectedError(dispatch);
      return Promise.resolve();
    }
    const roomName = room.roomName;
    const roomSecret = localStorage.getItem(`roomSecret:${roomName}`);
    return Meteor.callPromise('joinRoom', roomName, roomSecret, name, textAvatarColor).then(
      response => Promise.resolve(response),
      (error) => { unexpectedError({ dispatch, error }); },
    );
  };

