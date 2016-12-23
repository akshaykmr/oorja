import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import bcrypt from 'bcrypt';

import jwt from 'jwt-simple';
import { Random } from 'meteor/random';

import Rooms from '../../../collections/common';

const hashPassword = Meteor.wrapAsync(bcrypt.hash);
const comparePassword = Meteor.wrapAsync(bcrypt.compare);

const { private: { saltRounds, JWTsecret } } = Meteor.settings;

// Common error handling
const PASS_TO_CLIENT = 'PASS_TO_CLIENT'; // for error message.
const GENERIC_ERROR_MESSAGE = 'Something went wrong... ¯\\(°_o)/¯';

Meteor.methods({

  createRoom(roomInfo) {
    check(roomInfo, Object); // matches any object recieved for now. add validation later

    let { roomName } = roomInfo;
    roomName = roomName.trim().toLowerCase();

    // converts spaces to '-'. sometimes eslint gets on my nerves 😫
    roomName.split('').map((char) => {
      if (char === ' ') {
        return '-';
      }
      return char;
    });

    // error format : throw new Meteor.Error(error_topic,reason, passToClient)
    const errorTopic = 'Failed to create Room';

    try {
      const namePattern = /^[ @a-z0-9_-]+$/;
      if (!namePattern.test(roomName)) {
        throw new Meteor.Error(errorTopic, 'Invalid Room Name ಠ_ಠ', PASS_TO_CLIENT);
      }

      const { passwordEnabled } = roomInfo;
      const password = passwordEnabled ? hashPassword(roomInfo.password, saltRounds) : null;
      const roomDocument = {
        owner: Meteor.userId() || null,
        ...roomInfo,
        roomName,
        password,
        createdAt: new Date().getTime(),
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
        iat: new Date().getTime(),
        jti: Random.id(),
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
    } catch ({ details, reason }) {
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
});
