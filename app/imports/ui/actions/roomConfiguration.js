import { Meteor } from 'meteor/meteor';

export const CREATE_ROOM = 'CREATE_ROOM';

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
        return Promise.resolve(response);
      },
      error => Promise.reject(error)
    );
  };
