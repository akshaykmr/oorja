import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import _ from 'lodash';
import { moment as Moment } from 'meteor/momentjs:moment';
import jwt from 'jwt-simple';
import { Random } from 'meteor/random';

import * as HttpStatus from 'http-status-codes';

import { Rooms } from 'imports/collections/common';
import roomSetup from 'imports/modules/room/setup';
import roomAccess from 'imports/modules/room/access';
import roomProvider from 'imports/modules/room/provider/';

import { extractInitialsFromName } from 'imports/modules/user/utilities';

import response from './response';

import tabRegistry from './tabRegistry';


function validTokenPayload(payload, roomDocument) {
  const now = (new Moment()).toDate().getTime();
  return (payload.v === tokenVersion && payload.exp > now && roomDocument._id === payload.roomId);
}

Meteor.methods({

  createRoom(options) {
    check(options, Match.Maybe(Object));
    const roomSpecification = Object.assign(roomSetup.getDefaultParameters(), options || {});

    const validParameters = roomSetup.validateRoomSpecification(roomSpecification);
    if (!validParameters) {
      return response.error(HttpStatus.BAD_REQUEST, 'Invalid specifications for creating room');
    }

    if (roomSpecification.roomName) { // If User customized his room name
      roomSpecification.roomName = roomSetup.utilities.touchupRoomName(roomSpecification.roomName);
      const isValidRoomName = roomSetup.utilities.checkIfValidRoomName(roomSpecification.roomName);
      if (!isValidRoomName) {
        return response.error(HttpStatus.BAD_REQUEST, 'Room name not allowed');
      }
    } else {
      roomSpecification.roomName = roomSetup.getRandomRoomName();
    }
    if (Rooms.findOne({ roomName: roomSpecification.roomName, archived: false })) {
      return response.error(HttpStatus.CONFLICT, 'A room with same name exists (；一_一)');
    }


    const { shareChoices } = roomSetup.constants;
    const passwordEnabled = roomSpecification.shareChoice === shareChoices.PASSWORD;
    const password = passwordEnabled ? roomAccess.hashPassword(roomSpecification.password) : null;
    const roomSecret = !passwordEnabled ? Random.secret(10) : null;
    const roomId = Random.id(20);

    const roomDocument = {
      _id: roomId,
      provider: 'LICODE',
      creatorId: Meteor.userId() || null,
      roomName: roomSpecification.roomName,
      defaultTab: roomSpecification.defaultTab,
      tabs: roomSpecification.tabs,
      passwordEnabled,
      password,
      roomSecret,
      userTokens: [],
      participants: [],
      createdAt: new Moment().valueOf(),
      validTill: new Moment().add(4, 'days').valueOf(),
      archived: false,
    };

    if (!Rooms.insert(roomDocument)) return response.error(HttpStatus.INTERNAL_SERVER_ERROR);

    const providerMetadata = roomProvider.licode.createRoom(roomId, { p2p: true });
    Rooms.update(roomId, { $set: { providerMetadata } });

    return response.body(HttpStatus.CREATED, {
      roomName: roomSpecification.roomName,
      roomSecret,
      passwordEnabled,
      roomAccessToken: passwordEnabled ? roomAccess.createRoomAccessToken(roomId, password) : null,
    });
  },

  getRoomInfo(roomName, userToken) {
    check(roomName, String);
    /* eslint-disable new-cap */
    check(userToken, Match.Maybe(String));
    /* eslint-enable new-cap */
    const room = Rooms.findOne({ roomName, archived: false });
    if (!room) return response.error(HttpStatus.NOT_FOUND, 'Room not found');

    const existingUser = _.find(room.userTokens, { userToken });
    // be sure to filter for only relevent fields. dont send the whole doc lol.
    const info = _.pick(room, ['passwordEnabled', '_id', 'tabs']);

    const roomInfo = {
      ...info,
      existingUser: !!existingUser,
    };
    return roomInfo;
  },

  // returns null or roomAccessToken(string)
  authenticatePassword(roomName, password) {
    check(roomName, String);
    check(password, String);

    const roomDocument = Rooms.findOne({ roomName, archived: false });
    if (!roomDocument) {
      throw new Meteor.Error('Room not found');
    } else if (comparePassword(password, roomDocument.password)) {
      return jwt.encode({
        v: tokenVersion,
        iat: (new Moment()).toDate().getTime(),
        exp: roomDocument.validTill,
        roomId: roomDocument._id,
      }, JWTsecret, JWTalgo);
    }
    return null;
  },


  joinRoom(roomId, credentials, name, textAvatarColor) {
    check(roomId, String);
    check(credentials, Match.ObjectIncluding({
      roomSecret: String,
      roomAccessToken: String,
      userToken: String,
    }));

    const errorTopic = 'Failed to join Room';

    check(name, Match.Maybe(String));
    check(textAvatarColor, Match.Maybe(String)); // add check for allowed colors

    const room = Rooms.findOne({
      _id: roomId,
      archived: false,
    });

    if (!room) {
      throw new Meteor.Error(errorTopic, 'Room not found');
    }


    if (!room.passwordEnabled) {
      if (room.roomSecret !== credentials.roomSecret) {
        throw new Meteor.Error(errorTopic, 'Unauthorized');
      }
    } else {
      const payload = jwt.decode(credentials.roomAccessToken, JWTsecret);
      if (!validTokenPayload(payload, room)) {
        throw new Meteor.Error(errorTopic, 'Unauthorized');
      }
    }

    const user = Meteor.user();
    let userId = Meteor.userId();

    const existingUser = _.find(room.userTokens, { userToken: credentials.userToken }) ||
      (user ? _.find(room.userTokens, { userId: user._id }) : null);

    if (!existingUser) {
      if (!name || !textAvatarColor) {
        throw new Meteor.Error('missing name and avatar color');
      }
    }
    // TODO: add check to only allow access based on specific loginService if configured so in room.

    if (!user) { // for anonynymous users
      userId = Random.id(16);
      this.setUserId(userId);
    }


    const generateProfile = () => {
      let profile = {};
      if (user) {
        /* eslint-disable */
        profile = user.profile;
        /* eslint-enable */
        profile.initials = extractInitialsFromName(user.profile.firstName + user.profile.LastName);
      } else {
        profile.firstName = name.trim();
        profile.loginService = '';
        profile.picture = '';
        profile.initials = extractInitialsFromName(name);
      }
      profile.userId = userId;
      profile.textAvatarColor = textAvatarColor;
      return profile;
    };

    const result = N.API.createToken(room._id, userId, 'presenter');
    const erizoToken = result.content;


    if (!existingUser) {
      const profile = generateProfile();
      const newUserToken = {
        userId,
        userToken: Random.secret(25),
      };
      Rooms.update(room._id, { $push: { participants: profile, userTokens: newUserToken } });

      return {
        erizoToken,
        userId,
        newUserToken: newUserToken.userToken,
      };
    }

    return {
      erizoToken,
      userId: existingUser.userId,
      newUserToken: existingUser.userToken, // existing token
    };
  },

  addTab(roomId, credentials, tabId) {
    check(roomId, String);
    check(credentials, Match.ObjectIncluding({
      roomSecret: String,
      roomAccessToken: String,
    }));
    check(tabId, Number);
    const room = Rooms.findOne(roomId);
    if (!room.passwordEnabled) {
      if (room.roomSecret !== credentials.roomSecret) {
        throw new Meteor.Error('Unauthorized');
      }
    } else {
      const payload = jwt.decode(credentials.roomAccessToken, JWTsecret);
      if (!validTokenPayload(payload, room)) {
        throw new Meteor.Error('Unauthorized');
      }
    }

    const { tabs } = room;
    if (_.find(tabs, { tabId })) return;
    tabs.push(tabRegistry[tabId]);
    Rooms.update(roomId, {
      $set: { tabs },
    });
  },
});


Meteor.publish('room.info', (roomName, credentials) => {
  check(roomName, String);
  check(credentials, Match.ObjectIncluding({
    roomSecret: String,
    roomAccessToken: String,
  }));

  const roomCursor = Rooms.find({ roomName, archived: false }, {
    fields: {
      roomName: 1,
      defaultTabId: 1,
      tabs: 1,
      participants: 1,
      passwordEnabled: 1,
      roomSecret: 1,
      comms: 1,
      createdAt: 1,
    },
    limit: 1,
  });

  const roomDocument = roomCursor.fetch()[0];
  if (!roomDocument) throw new Meteor.Error('Room document not found');
  if (roomDocument.passwordEnabled) {
    if (!credentials.roomAccessToken) throw new Meteor.Error('Token Required');
    const payload = jwt.decode(credentials.roomAccessToken, JWTsecret);
    if (validTokenPayload(payload, roomDocument)) {
      return roomCursor;
    }
  } else if (roomDocument.roomSecret === credentials.roomSecret) return roomCursor;

  return null;
});


Meteor.startup(() => {
  Rooms._ensureIndex({
    roomName: 1,
    roomSecret: 1,
    validTill: 1,
    archived: 1,
    passwordEnabled: 1,
  });
});
