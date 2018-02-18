import { Meteor } from 'meteor/meteor';
import * as HttpStatus from 'http-status-codes';
import response from 'imports/startup/server/response';

import userAccess from 'imports/modules/user/access';
import roomAccess from 'imports/modules/room/access';

import Router from '../router';

const { private: { privateAPISecret } } = Meteor.settings;

Router.Middleware.use((req, res, next) => {
  if (req.url.includes('/api/v1/private')) {
    if (req.headers['oorja-secret'] === privateAPISecret) return next();
    return Router.sendResult(res, { code: HttpStatus.UNAUTHORIZED });
  }
  return next();
});


Router.add('post', '/api/v1/private/decode_token', (req, res, _next) => {
  const { type, token } = req.body;
  switch (type) {
    case 'user':
      return Router.sendResult(res, {
        code: HttpStatus.OK,
        data: response.body(HttpStatus.OK, { user_id: userAccess.getUserId(token) }),
      });
    case 'room':
      return Router.sendResult(res, {
        code: HttpStatus.OK,
        data: response.body(HttpStatus.OK, { room_id: roomAccess.getRoomId(token) }),
      });
    default:
      return Router.sendResult(res, {
        code: HttpStatus.BAD_REQUEST,
        data: response.error(HttpStatus.BAD_REQUEST, 'invalid token type'),
      });
  }
});
