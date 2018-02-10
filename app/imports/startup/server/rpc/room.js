import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import _ from 'lodash';
import moment from 'moment';
import { Random } from 'meteor/random';

import * as HttpStatus from 'http-status-codes';

import { Rooms } from 'imports/collections/common';
import roomSetup from 'imports/modules/room/setup';
import roomAccess from 'imports/modules/room/access';
import roomProvider from 'imports/modules/room/provider/';

import { extractInitialsFromName } from 'imports/modules/user/utilities';

import response from 'imports/startup/server/response';


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
      createdAt: moment().valueOf(),
      validTill: moment().add(4, 'days').valueOf(),
      archived: false,
    };

    if (!Rooms.insert(roomDocument)) return response.error(HttpStatus.INTERNAL_SERVER_ERROR);

    const providerMetadata = roomProvider.licode.createRoom(roomId, { p2p: true });
    Rooms.update(roomId, { $set: { providerMetadata } });

    return response.body(HttpStatus.CREATED, {
      roomName: roomSpecification.roomName,
      roomSecret,
      passwordEnabled,
      roomAccessToken: passwordEnabled ? roomAccess.createRoomAccessToken(roomId) : null,
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

  authenticatePassword(roomName, password) {
    check(roomName, String);
    check(password, String);

    const roomDocument = Rooms.findOne({ roomName, archived: false });
    if (!roomDocument) return response.error(HttpStatus.NOT_FOUND, 'Room not found');

    if (!roomAccess.comparePassword(password, roomDocument.password)) {
      return response.error(HttpStatus.UNAUTHORIZED, 'Incorrect room password 😕');
    }

    const roomAccessToken = roomAccess.createRoomAccessToken(roomDocument._id);
    return response.body(
      HttpStatus.OK,
      { roomAccessToken },
    );
  },

  // TODO: clean this mess
  joinRoom(roomId, credentials, userToken, name, textAvatarColor) {
    check(roomId, String);
    check(credentials, Match.ObjectIncluding({
      roomSecret: String,
      roomAccessToken: String,
    }));
    check(name, Match.Maybe(String));
    check(textAvatarColor, Match.Maybe(String));
    check(userToken, Match.Maybe(String));

    const room = Rooms.findOne({ _id: roomId, archived: false });
    if (!room) response.error(HttpStatus.NOT_FOUND, 'Room not found');

    if (!roomAccess.areCredentialsValid(room, credentials)) {
      return response.error(HttpStatus.UNAUTHORIZED, 'Unauthorized');
    }

    const user = Meteor.user();
    let userId = Meteor.userId();

    const existingUser = _.find(room.userTokens, { userToken }) ||
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
    if (!roomAccess.areCredentialsValid(room, credentials)) {
      return response.error(HttpStatus.UNAUTHORIZED, 'Unauthorized');
    }

    const { tabs } = room;
    if (_.find(tabs, { tabId })) return response.body(HttpStatus.OK);

    tabs.push(tabId);
    Rooms.update(roomId, { $set: { tabs } });

    return response.body(HttpStatus.OK);
  },
});


Meteor.publish('room.info', (roomName, credentials) => {
  check(roomName, String);
  check(credentials, Match.ObjectIncluding({
    roomSecret: String,
    roomAccessToken: String,
  }));

  const room = Rooms.findOne({ roomName, archived: false });

  if (!roomAccess.areCredentialsValid(room, credentials)) {
    return null;
  }

  const roomCursor = Rooms.find({ _id: room._id }, {
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

  return roomCursor;
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
