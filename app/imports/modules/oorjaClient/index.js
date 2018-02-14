import { Meteor } from 'meteor/meteor';
import * as HttpStatus from 'http-status-codes';

import { RoomStorage, storeKeys } from 'imports/modules/room/storage';

import { unexpectedError } from './internal';

const OorjaClient = {
  createRoom(roomSpecification) {
    return Meteor.callPromise('createRoom', roomSpecification)
      .then((response) => {
        if (response.status === HttpStatus.CREATED) {
          const { roomId, roomSecret, roomAccessToken } = response.data;
          new RoomStorage(roomId)
            .clear()
            .setKeys({
              [storeKeys.ACCESS_TOKEN]: roomAccessToken,
              [storeKeys.SECRET]: roomSecret,
            });
        }
        return response;
      });
  },

  lookupRoom(roomName) {
    // Returns minimal information of the room
    return Meteor.callPromise('lookupRoom', roomName);
  },

  unlockWithPassword(roomId, password) {
    return Meteor.callPromise('unlockWithPassword', roomId, password).then(
      (response) => {
        if (response.status === HttpStatus.OK) {
          const { roomAccessToken } = response.data;
          new RoomStorage(roomId)
            .setKey(storeKeys.ACCESS_TOKEN, roomAccessToken);
        }
        return response;
      },
      (error) => {
        unexpectedError({ roomId, error });
        return Promise.reject();
      },
    );
  },

  checkIfExistingUser(roomId) {
    const store = new RoomStorage(roomId);
    const userToken = store.getUserToken();
    const userId = store.getUserId();
    return new Promise((resolve, reject) => {
      if (!userId || !userToken) return reject();

      return Meteor.callPromise('checkIfExistingUser', roomId, userId, userToken)
        .then(
          (response) => {
            if (response.status !== HttpStatus.OK || !response.data.existingUser) {
              return reject();
            }
            return resolve();
          },
          () => reject(),
        );
    });
  },

  joinRoom(roomId, name = '', textAvatarColor = '') {
    const store = new RoomStorage(roomId);
    const userToken = store.getUserToken();
    const credentials = store.getRoomCredentials();
    return Meteor.callPromise('joinRoom', roomId, credentials, userToken, name, textAvatarColor).then(
      (response) => {
        if (response.status === HttpStatus.OK) {
          const {
            erizoToken, userId, userToken: newUserToken, beamToken,
          } = response.data;

          Meteor.connection.setUserId(userId);

          store.setKeys({
            [storeKeys.ERIZO_TOKEN]: erizoToken,
            [storeKeys.USER_ID]: userId,
            [storeKeys.USER_TOKEN]: newUserToken,
            [storeKeys.BEAM_TOKEN]: beamToken,
          });
        }

        return response;
      },
      (error) => {
        unexpectedError({ error, roomId });
        return Promise.reject();
      },
    );
  },

  subscribeToRoom(roomId) {
    const credentials = new RoomStorage(roomId).getRoomCredentials();
    return Meteor.subscribe('room.info', roomId, credentials);
  },

  addTab(roomId, tabId) {
    const credentials = new RoomStorage(roomId).getRoomCredentials();
    return Meteor.callPromise('addTab', roomId, credentials, tabId);
  },
};
export default OorjaClient;
