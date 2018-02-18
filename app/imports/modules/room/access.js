
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

  areCredentialsValid(room, credentials) {
    if (!room.passwordEnabled && (room.roomSecret === credentials.roomSecret)) {
      return true;
    }
    const payload = tokenHandler.decode(credentials.roomAccessToken);
    return payload && payload.roomId === room._id;
  },
};

export default roomAccess;
