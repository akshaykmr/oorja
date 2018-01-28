
import { Meteor } from 'meteor/meteor';
import bcrypt from 'bcrypt';
import { moment as Moment } from 'meteor/momentjs:moment';
import jwt from 'jwt-simple';


const hashPassword = Meteor.wrapAsync(bcrypt.hash);
const comparePassword = Meteor.wrapAsync(bcrypt.compare);

const {
  private: {
    saltRounds, JWTsecret, JWTalgo, tokenVersion,
  },
} = Meteor.settings;

export default {
  hashPassword(password) {
    return hashPassword(password, saltRounds);
  },

  createRoomAccessToken(roomId, password) {
    const now = new Moment();
    return jwt.encode({
      v: tokenVersion,
      iat: now.valueOf(),
      exp: now.add(2, 'days').valueOf(),
      roomId,
    }, JWTsecret + password, JWTalgo);
  },
};
