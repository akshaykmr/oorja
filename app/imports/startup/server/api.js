import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import bcrypt from 'bcrypt';
import jwt from 'jwt-simple';

import Rooms from '../../collections/common';

const hashPassword = Meteor.wrapAsync(bcrypt.hash);
const comparePassword = Meteor.wrapAsync(bcrypt.compare);

const { private: { saltRounds, JWTsecret } } = Meteor.settings;

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

    const namePattern = /^[ @a-z0-9_-]+$/;
    if (!namePattern.test(roomName)) {
      throw new Meteor.Error('Failed to create Room', 'Invalid Room Name');
    }
    const password = hashPassword(roomInfo.password, saltRounds);
    const token = jwt.encode({
      roomName,
      iat: new Date().getTime(),
    }, JWTsecret);

    const roomDocument = {
      ...roomInfo,
      roomName,
      password,
      token,
    };

    if (!Rooms.insert(roomDocument)) {
      throw new Meteor.Error('Failed to create Room');
    }

    return { token };
  },

  loginRoom(roomName, password) {
    check(roomName, String);
    check(password, String);
  },
});
