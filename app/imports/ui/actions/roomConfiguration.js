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
        const { createdRoomName, creatorToken, shareToken } = response;
        // its called createdRoomName because some minor changes may be done to
        // the name send by the client above.
        // store token and shareToken in localStorage
        localStorage.setItem(`roomToken:${createdRoomName}`, creatorToken);
        localStorage.setItem(`roomShareToken:${createdRoomName}`, shareToken);
        return Promise.resolve(createdRoomName);
      },
      error => Promise.reject(error)
    );
  };
