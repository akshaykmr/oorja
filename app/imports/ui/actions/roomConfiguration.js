import { Meteor } from 'meteor/meteor';
import { browserHistory } from 'react-router';

import { Intent } from '@blueprintjs/core';
import SupremeToaster from '../components/Toaster';

export const CREATE_ROOM = 'CREATE_ROOM';
export const DELETE_TOKENS = 'DELETE_TOKENS';
export const GOT_ROOM_INFO = 'GOT_ROOM_INFO';
export const UNEXPECTED_AUTHENTICATION_ERROR = 'UNEXPECTED_AUTHENTICATION_ERROR';

const GENERIC_ERROR_MESSAGE = 'Something went wrong... ¯\\(°_o)/¯';

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
        const { createdRoomName, creatorToken, shareToken } = response;
        // its called createdRoomName because some minor changes may be done to
        // the name send by the client above.
        // store token and shareToken in localStorage
        localStorage.setItem(`roomToken:${createdRoomName}`, creatorToken);
        localStorage.setItem(`roomShareToken:${createdRoomName}`, shareToken);
        dispatch({
          type: CREATE_ROOM,
          payload: createdRoomName,
        });
        return Promise.resolve(createdRoomName);
      },
      error => Promise.reject(error)
    );
  };

export const deleteTokens = (roomName) => {
  localStorage.removeItem(`roomToken:${roomName}`);
  localStorage.removeItem(`roomShareToken:${roomName}`);

  return {
    type: DELETE_TOKENS,
  };
};

export const getRoomInfo = roomName => ({
  type: GOT_ROOM_INFO,
  payload: Meteor.callPromise('getRoomInfo', roomName),
});


export const authenticatePassword = (roomName, password) =>
  dispatch =>
    Meteor.callPromise('authenticatePassword', roomName, password).then(
      ({ token }) => Promise.resolve(token),
      () => {
        browserHistory.push('/');
        dispatch({
          type: UNEXPECTED_AUTHENTICATION_ERROR,
        });
        SupremeToaster.show({
          message: GENERIC_ERROR_MESSAGE,
          intent: Intent.DANGER,
        });
      }
    );
