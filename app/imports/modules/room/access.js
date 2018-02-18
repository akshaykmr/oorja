
import { Meteor } from 'meteor/meteor';
import bcrypt from 'bcrypt';

import tokenHandler from 'imports/modules/tokenHandler';

const bcryptHash = Meteor.wrapAsync(bcrypt.hash);
const bcryptCompare = Meteor.wrapAsync(bcrypt.compare);

const { private: { saltRounds } } = Meteor.settings;

const roomAccess = {
  hashPassword(password) {
    return bcryptHash(password, saltRounds);
  },

  comparePassword(password, hashedPassword) {
    return bcryptCompare(password, hashedPassword);
  },

  createAccessToken(roomId) {
    return tokenHandler.issue({ roomId });
  },

  getRoomId(token) {
    return tokenHandler.decode(token).roomId;
  },

  areCredentialsValid(room, credentials) {
    if (!room.passwordEnabled && (room.roomSecret === credentials.roomSecret)) {
      return true;
    }
    return this.getRoomId(credentials.roomAccessToken) === room._id;
  },
};

export default roomAccess;
