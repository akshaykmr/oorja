import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import bcrypt from 'bcrypt';
import _ from 'lodash';
import { moment as Moment } from 'meteor/momentjs:moment';

import jwt from 'jwt-simple';
import { Random } from 'meteor/random';

import { Rooms } from '../../../collections/common';

const hashPassword = Meteor.wrapAsync(bcrypt.hash);
const comparePassword = Meteor.wrapAsync(bcrypt.compare);

const { private: { saltRounds, JWTsecret } } = Meteor.settings;

// Common error handling
const PASS_TO_CLIENT = 'PASS_TO_CLIENT';
const GENERIC_ERROR_MESSAGE = 'Something went wrong... ¯\\(°_o)/¯';

Meteor.methods({

  createRoom(roomInfo) {
    check(roomInfo, Object); // matches any object recieved for now. add validation later

    let { roomName } = roomInfo;
    roomName = roomName.trim().toLowerCase();

    roomName.split('').map((char) => {
      if (char === ' ') {
        return '-';
      }
      return char;
    });

    // error format : throw new Meteor.Error(errorTopic,reason, passToClient)
    const errorTopic = 'Failed to create Room';

    try {
      const namePattern = /^[ @a-z0-9_-]+$/;
      if (!namePattern.test(roomName)) {
        throw new Meteor.Error(errorTopic, 'Invalid Room Name ಠ_ಠ', PASS_TO_CLIENT);
      }

      const { passwordEnabled } = roomInfo;
      const password = passwordEnabled ? hashPassword(roomInfo.password, saltRounds) : null;

      const now = new Moment();
      const validTill = now.add(7, 'days').toDate().getTime();

      const roomDocument = {
        owner: Meteor.userId() || null,
        ...roomInfo,
        roomName,
        password,
        createdAt: now.toDate().getTime(),
        validTill,
      };
      if (Rooms.findOne({ roomName })) {
        throw new Meteor.Error(errorTopic, 'Room with same name exists (；一_一)', PASS_TO_CLIENT);
      }
      // Add schema validation later.
      const roomId = Rooms.insert(roomDocument);
      if (!roomId) {
        throw new Meteor.Error(errorTopic, 'Failed to create Room');
      }

      // jwt for room creator
      const jwtPayload = {
        roomId,
        roomCreator: true,
        iat: now.toDate().getTime(),
        jti: Random.id(),
        validTill,
      };
      const creatorToken = jwt.encode(jwtPayload, JWTsecret);
      jwtPayload.roomCreator = false;

      // creator boolean in case I need to add some room permissions later.
      const shareToken = jwt.encode(jwtPayload, JWTsecret);

      return {
        createdRoomName: roomName,
        creatorToken,
        shareToken,
      };
    } catch (exception) {
      console.log(exception);
      const { details, reason } = exception;
      throw new Meteor.Error(
        errorTopic,
        details === PASS_TO_CLIENT ? reason : GENERIC_ERROR_MESSAGE
      );
    }
  },

  loginRoom(roomName, password) {
    check(roomName, String);
    check(password, String);
  },

  getRoomInfo(roomName) {
    check(roomName, String);
    const room = Rooms.findOne({ roomName });
    if (!room) {
      return null;
    }
    return _.pick(room, ['passwordEnabled']);
  },

  authenticatePassword(roomName, password) {
    check(roomName, String);
    check(password, String);

    let token = null;
    const room = Rooms.findOne(roomName);
    if (!room) {
      throw new Meteor.Error('Room not found');
    } else if (comparePassword(password, room.password)) {
      // jwt for room creator
      const jwtPayload = {
        roomId: room._id,
        iat: new Date().getTime(),
        jti: Random.id(),
        validTill: room.validTill,
      };
      token = jwt.encode(jwtPayload, JWTsecret);
    }
    return {
      token,
    };
  },
});
