
import { Meteor } from 'meteor/meteor';
import bcrypt from 'bcrypt';
import moment from 'moment';
import jwt from 'jwt-simple';


const bcryptHash = Meteor.wrapAsync(bcrypt.hash);
const bcryptCompare = Meteor.wrapAsync(bcrypt.compare);

const {
  private: {
    saltRounds, JWTsecret, JWTalgo,
  },
} = Meteor.settings;

const tokenVersion = 1;

export default {
  hashPassword(password) {
    return bcryptHash(password, saltRounds);
  },

  comparePassword(password, hashedPassword) {
    return bcryptCompare(password, hashedPassword);
  },

  createRoomAccessToken(roomId) {
    return jwt.encode({
      v: tokenVersion,
      iat: moment().valueOf(),
      roomId,
    }, JWTsecret, JWTalgo);
  },

  createBeamToken(roomId, userId) {
    return jwt.encode({
      v: tokenVersion,
      iat: moment().valueOf(),
      roomId,
      userId,
    }, JWTsecret, JWTalgo);
  },

  decodeAccessToken(token) {
    try {
      return jwt.decode(token, JWTsecret);
    } catch (e) {
      return null;
    }
  },

  areCredentialsValid(room, credentials) {
    if (!room.passwordEnabled && (room.roomSecret === credentials.roomSecret)) {
      return true;
    }
    const payload = this.decodeAccessToken(credentials.roomAccessToken);
    return payload && this.isTokenPayloadValid(payload, room);
  },

  isTokenPayloadValid(payload, roomDocument) {
    return (payload.v === tokenVersion && roomDocument._id === payload.roomId);
  },
};
