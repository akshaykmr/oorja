import * as HttpStatus from 'http-status-codes';
import response from 'imports/startup/server/response';

import roomAccess from 'imports/modules/room/access';

import Router from '../router';

Router.add('post', '/api/v1/jwt_decode', (req, res, _next) => {
  const { token } = req.body;

  const payload = roomAccess.decodeAccessToken(token);

  if (!payload) {
    Router.sendResult(res, {
      code: HttpStatus.BAD_REQUEST,
      data: response.error(HttpStatus.BAD_REQUEST, 'Invalid token'),
    });
  }

  Router.sendResult(res, {
    code: HttpStatus.OK,
    data: response.body(HttpStatus.OK, { ...payload }),
  });
});


// test
Router.add('get', '/api/v1/beam_token', (req, res, _next) => {
  Router.sendResult(res, {
    code: HttpStatus.OK,
    data: response.body(HttpStatus.OK, { token: roomAccess.createBeamToken(123, 456) }),
  });
});
