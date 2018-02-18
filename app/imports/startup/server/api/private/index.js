import { Meteor } from 'meteor/meteor';
import * as HttpStatus from 'http-status-codes';
import response from 'imports/startup/server/response';
import tokenHandler from 'imports/modules/tokenHandler';

import Router from '../router';

const { private: { privateAPISecret } } = Meteor.settings;

Router.Middleware.use((req, res, next) => {
  if (req.url.includes('/api/v1/private')) {
    if (req.headers['oorja-secret'] === privateAPISecret) return next();
    return Router.sendResult(res, { code: HttpStatus.UNAUTHORIZED });
  }
  return next();
});


Router.add('post', '/api/v1/private/jwt_decode', (req, res, _next) => {
  const { token } = req.body;
  const payload = tokenHandler.decode(token);

  if (!payload) {
    return Router.sendResult(res, {
      code: HttpStatus.BAD_REQUEST,
      data: response.error(HttpStatus.BAD_REQUEST, 'Invalid token'),
    });
  }

  return Router.sendResult(res, {
    code: HttpStatus.OK,
    data: response.body(HttpStatus.OK, { ...payload }),
  });
});
