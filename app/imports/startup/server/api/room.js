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

  getRoomInfo(roomName) {
    check(roomName, String);
    const room = Rooms.findOne({ roomName, archived: false });
    if (!room) return response.error(HttpStatus.NOT_FOUND, 'Room not found');
    // be sure to filter for only relevent fields. dont send the whole doc lol.
    return response.body(HttpStatus.OK, _.pick(room, ['passwordEnabled', '_id', 'tabs', 'roomName']));
  },

  checkIfExistingUser(roomName, userToken) {
    check(roomName, String);
    check(userToken, String);

    const room = Rooms.findOne({ roomName, archived: false });
    if (!room) return response.error(HttpStatus.NOT_FOUND, 'Room not found');

    return response.body(HttpStatus.OK, { existingUser: _.find(room.userTokens, { userToken }) });
  },

  // returns null or roomAccessToken(string)
  authenticatePassword(roomName, password) {
    check(roomName, String);
    check(password, String);

    const roomDocument = Rooms.findOne({ roomName, archived: false });
    if (!roomDocument) return response.error(HttpStatus.NOT_FOUND, 'Room not found');

    if (!roomAccess.comparePassword(password, roomDocument.password)) {
      return response.error(HttpStatus.UNAUTHORIZED, 'Incorrect room password 😕');
    }
    const { _id, password: hashedPassword } = roomDocument;
    const roomAccessToken = roomAccess.createRoomAccessToken(_id, hashedPassword);
    return response.body(
      HttpStatus.OK,
      { roomAccessToken },
    );
  },

  // TODO: clean this mess
  joinRoom(roomId, credentials, name, textAvatarColor) {
    check(roomId, String);
    check(credentials, Match.ObjectIncluding({
      roomSecret: String,
      roomAccessToken: String,
      userToken: String,
    }));
    check(name, Match.Maybe(String));
    check(textAvatarColor, Match.Maybe(String)); // add check for allowed colors

    const room = Rooms.findOne({ _id: roomId, archived: false });
    if (!room) response.error(HttpStatus.NOT_FOUND, 'Room not found');

    if (!room.passwordEnabled) {
      if (room.roomSecret !== credentials.roomSecret) {
        return response.error(HttpStatus.UNAUTHORIZED, 'Room secret does not match');
      }
    } else {
      const payload = roomAccess.decodeAccessToken(credentials.roomAccessToken, room.password);
      if (!payload || !roomAccess.isTokenPayloadValid(payload, room)) {
        return response.error(HttpStatus.UNAUTHORIZED, 'Unauthorized');
      }
    }

    const user = Meteor.user();
    let userId = Meteor.userId();

    const existingUser = _.find(room.userTokens, { userToken: credentials.userToken }) ||
      (user ? _.find(room.userTokens, { userId: user._id }) : null);

    if (!existingUser) {
      if (!name || !textAvatarColor) {
        return response.error(HttpStatus.BAD_REQUEST, 'Missing user name or avatar color');
      }
    }

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

    const erizoToken = roomProvider.licode.createToken(room.providerMetadata, userId);

    if (!existingUser) {
      const profile = generateProfile();
      const newUserToken = {
        userId,
        userToken: Random.secret(25),
      };
      Rooms.update(room._id, { $push: { participants: profile, userTokens: newUserToken } });

      return response.body(HttpStatus.OK, {
        erizoToken,
        userId,
        userToken: newUserToken.userToken,
      });
    }

    return response.body(HttpStatus.OK, {
      erizoToken,
      userId: existingUser.userId,
      userToken: existingUser.userToken, // existing token
    });
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
      defaultTab: 1,
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
    const payload = roomAccess.decodeAccessToken(
      credentials.roomAccessToken,
      roomDocument.password,
    );
    if (payload && roomAccess.isTokenPayloadValid(payload, roomDocument)) {
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
