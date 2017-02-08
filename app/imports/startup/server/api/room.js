import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import bcrypt from 'bcrypt';
import _ from 'lodash';
import { moment as Moment } from 'meteor/momentjs:moment';
// import jwt from 'jwt-simple';
import { Random } from 'meteor/random';

import { Rooms } from '../../../collections/common';
import N from '../../../modules/NuveClient/';

const { private: { saltRounds, Nuve } } = Meteor.settings;

N.API.init(Nuve.serviceId, Nuve.serviceKey, Nuve.host);

const hashPassword = Meteor.wrapAsync(bcrypt.hash);
const comparePassword = Meteor.wrapAsync(bcrypt.compare);

// Common error handling
const PASS_TO_CLIENT = 'PASS_TO_CLIENT';
const GENERIC_ERROR_MESSAGE = 'Something went wrong... ¯\\(°_o)/¯';

Meteor.methods({

  createRoom(roomInfo) {
    check(roomInfo, Object); // matches any object recieved for now. add validation later

    let { roomName } = roomInfo;
    roomName = roomName.trim();

    roomName = roomName.split('').map((char) => {
      if (char === ' ') {
        return '-';
      }
      return char;
    }).join('');

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
      const roomSecret = Random.secret(14);

      const response = N.API.createRoom(roomName);

      const roomDocument = {
        _id: response.data._id,
        NuveServiceName: Nuve.serviceName,
        owner: Meteor.userId() || null,
        ...roomInfo,
        roomName,
        roomSecret,
        userTokens: [],
        password,
        participants: [],
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

      return {
        createdRoomName: roomName,
        roomSecret,
      };
    } catch (exception) {
      console.log(exception);
      const { details, reason } = exception;
      // add logging.
      throw new Meteor.Error(
        errorTopic,
        details === PASS_TO_CLIENT ? reason : GENERIC_ERROR_MESSAGE
      );
    }
  },

  getRoomInfo(roomName, userToken) {
    check(roomName, String);
    /* eslint-disable new-cap*/
    check(userToken, Match.Maybe(String));
    /* eslint-enable new-cap */
    const room = Rooms.findOne({ roomName });
    if (!room) {
      return null;
    }
    const existingUser = _.find(room.userTokens, { userToken });
    // be sure to filter for only relevent fields. dont send the whole doc lol.
    const info = _.pick(room, ['passwordEnabled']);

    const roomInfo = {
      ...info,
      existingUser: !!existingUser,
    };
    return roomInfo;
  },

  // returns null or roomSecret(string)
  authenticatePassword(roomName, password) {
    check(roomName, String);
    check(password, String);

    const room = Rooms.findOne({ roomName });
    if (!room) {
      throw new Meteor.Error('Room not found');
    } else if (comparePassword(password, room.password)) {
      return room.roomSecret;
    }
    return null;
  },

  joinRoom(roomName, roomSecret, name, textAvatarColor, userToken) {
    check(roomName, String);
    check(roomSecret, String);
    /* eslint-disable new-cap*/
    check(name, Match.Maybe(String));
    check(textAvatarColor, Match.Maybe(String)); // add check for allowed colors
    check(userToken, Match.Maybe(String));
    /* eslint-enable new-cap */

    if (!userToken) {
      if (!name || !textAvatarColor) {
        throw new Meteor.Error('missing user name');
      }
    }

    const room = Rooms.findOne({
      roomName,
      roomSecret,
    });
    const errorTopic = 'Failed to join Room';
    if (!room) {
      throw new Meteor.Error(errorTopic, 'Room not found');
    }

    const user = Meteor.user();
    let userId = Meteor.userId();

    // TODO: add check to only allow access based on loginService if configured so in room.

    if (!user) { // for anonynymous users
      userId = Random.id(10);
      this.setUserId(userId);
    }
    const computeInitials = (fullName) => {
      // first two letters of the name or first letters of first and last word.
      const words = fullName.toUpperCase().trim().split(' ');
      let initials = '';
      if (words.length > 1) {
        initials = words[0][0] + words[words.length - 1][0];
      } else if (words.length === 1 && words[0] !== '') {
        initials = words[0][0];
        if (words[0][1]) initials += words[0][1];
      }
      return initials;
    };

    const generateProfile = () => {
      let profile = {};
      if (user) {
        profile = user.profile;
        profile.initials = computeInitials(user.profile.firstName + user.profile.LastName);
      } else {
        profile.firstName = name.trim();
        profile.loginService = '';
        profile.picture = '';
        profile.initials = computeInitials(name);
      }
      profile.userId = userId;
      profile.textAvatarColor = textAvatarColor;
      return profile;
    };

    const result = N.API.createToken(room._id, userId, 'presenter');
    const roomToken = result.content;

    const existingUser = _.find(room.userTokens, { userToken })
      || user ? _.find(room.userTokens, { userId: user._id }) : null;

    if (!existingUser) {
      const profile = generateProfile();
      const newUserToken = {
        userId,
        userToken: Random.secret(25),
      };
      Rooms.update(room._id, { $push: { participants: profile, userTokens: newUserToken } });

      return {
        roomToken,
        userId,
        newUserToken: newUserToken.userToken,
      };
    }

    return {
      roomToken,
      userId,
      newUserToken: existingUser.userToken, // existing token
    };
  },

  joinRoomWithAnonToken(roomName, roomSecret, anonToken) {
    check(roomName, String);
    check(roomSecret, String);
    check(anonToken, String);

    const room = Rooms.findOne({
      roomName,
      roomSecret,
    });
    const user = Meteor.user();

    const errorTopic = 'Failed to join Room with anonToken';
    if (!room) {
      throw new Meteor.Error(errorTopic, 'Room not found');
    }
    if (user) {
      throw new Meteor.Error(errorTopic, 'User signed in with a service');
    }
    const anon = _.find(room.anonTokens, { anonToken });

    if (!anon) {
      throw new Meteor.Error(errorTopic, 'token invalid');
    } else {
      const result = N.API.createToken(room._id, anon.userId, 'presenterRecord');
      return {
        userId: anon.userId,
        token: result.content,
        anonToken: anon.anonToken,
      };
    }
  },
});


Meteor.publish('room.info', (roomName, roomSecret) => {
  check(roomName, String);
  check(roomSecret, String);

  return Rooms.find({ roomName, roomSecret }, {
    fields: {
      roomName: 1,
      participants: 1,
      comms: 1,
      createdAt: 1,
    },
    limit: 1,
  });
});
