
import { Meteor } from 'meteor/meteor';
import bcrypt from 'bcrypt';
import { moment as Moment } from 'meteor/momentjs:moment';
import jwt from 'jwt-simple';


const bcryptHash = Meteor.wrapAsync(bcrypt.hash);
const bcryptCompare = Meteor.wrapAsync(bcrypt.compare);

const {
  private: {
    saltRounds, JWTsecret, JWTalgo, tokenVersion,
  },
} = Meteor.settings;

export default {
  hashPassword(password) {
    return bcryptHash(password, saltRounds);
  },

  comparePassword(password, hashedPassword) {
    return bcryptCompare(password, hashedPassword);
  },

  createRoomAccessToken(roomId, hashedPassword) {
    const now = new Moment();
    return jwt.encode({
      v: tokenVersion,
      iat: now.valueOf(),
      exp: now.add(2, 'days').valueOf(),
      roomId,
    }, JWTsecret + hashedPassword, JWTalgo);
    // Add hashed password to the jwt secret so that if room password is changed
    // it invalidates any existing tokens
  },

  decodeAccessToken(token, hashedPassword) {
    try {
      return jwt.decode(token, JWTsecret + hashedPassword);
    } catch (e) {
      return null;
    }
  },

  areCredentialsValid(room, credentials) {
    if (!room.passwordEnabled && (room.roomSecret === credentials.roomSecret)) {
      return true;
    }
    const payload = this.decodeAccessToken(credentials.roomAccessToken, room.password);
    return payload && this.isTokenPayloadValid(payload, room);
  },

  isTokenPayloadValid(payload, roomDocument) {
    const now = (new Moment()).valueOf();
    return (payload.v === tokenVersion && payload.exp > now && roomDocument._id === payload.roomId);
  },
};
