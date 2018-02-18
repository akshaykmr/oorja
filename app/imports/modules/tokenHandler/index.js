import { Meteor } from 'meteor/meteor';
import moment from 'moment';
import jwt from 'jwt-simple';

const { private: { JWTsecret, JWTalgo } } = Meteor.settings;

const tokenVersion = 1;

/*
  This module only packs/unpacks a payload into a token.
  Usage/Expiry/Invalidation/etc. is the responsibility of the consumer of this module.
*/

const tokenHandler = {
  issue(contents) {
    return jwt.encode({
      ...contents,
      v: tokenVersion,
      iat: moment().valueOf(),
    }, JWTsecret, JWTalgo);
  },

  decode(token) {
    let payload = null;
    try {
      payload = jwt.decode(token, JWTsecret);
    } catch (e) {
      return null;
    }
    if (payload.v !== tokenVersion) {
      return null;
    }
    return payload;
  },
};

export default tokenHandler;
