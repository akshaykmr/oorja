import Storage from 'imports/modules/Storage';

export const ROOM_STORE_PREFIX = 'ROOM';

// Local storage keys for Room related data
export const storeKeys = {
  ACCESS_TOKEN: 'ACCESS_TOKEN',
  SECRET: 'SECRET',
  ERIZO_TOKEN: 'ERIZO_TOKEN',
  USER_ID: 'USER_ID',
  USER_TOKEN: 'USER_TOKEN',
  READY: 'READY',
  LAST_ACTIVE_TAB: 'LAST_ACTIVE_TAB',
};

export class RoomStorage extends Storage {
  constructor(roomId) {
    super(`${ROOM_STORE_PREFIX}:${roomId}`);
  }

  getUserToken() {
    return this.getKey(storeKeys.USER_TOKEN);
  }

  getUserId() {
    return this.getKey(storeKeys.USER_ID);
  }

  getRoomCredentials() {
    return {
      roomSecret: this.getKey(storeKeys.SECRET) || '',
      roomAccessToken: this.getKey(storeKeys.ACCESS_TOKEN) || '',
    };
  }

  saveRoomSecret(secret) {
    this.setKey(storeKeys.SECRET, secret);
    return this;
  }

  saveLastActiveTab(tabId) {
    this.setKey(storeKeys.LAST_ACTIVE_TAB, tabId);
    return this;
  }

  getLastActiveTab() {
    return this.getKey(storeKeys.LAST_ACTIVE_TAB);
  }

  getLastReadyTime() {
    return this.getKey(storeKeys.READY);
  }

  saveLastReadyTime(isoDateString) {
    this.setKey(storeKeys.READY, isoDateString);
    return this;
  }

  clearLastReadyTime() {
    this.deleteKey(storeKeys.READY);
    return this;
  }

  getAccessToken() {
    return this.getKey(storeKeys.ACCESS_TOKEN);
  }

  getErizoToken() {
    return this.getKey(storeKeys.ERIZO_TOKEN);
  }

  deleteRoomAccessToken() {
    this.deleteKey(storeKeys.ACCESS_TOKEN);
    return this;
  }

  deleteSavedUser() {
    this.deleteKeys([
      storeKeys.USER_ID,
      storeKeys.USER_TOKEN,
      storeKeys.READY,
    ]);
    return this;
  }
}

export default RoomStorage;
