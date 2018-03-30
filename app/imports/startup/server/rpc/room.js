import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import _ from 'lodash';
import moment from 'moment';
import { Random } from 'meteor/random';

import * as HttpStatus from 'http-status-codes';

import { Rooms } from 'imports/collections/server';
import roomSetup from 'imports/modules/room/setup';
import roomAccess from 'imports/modules/room/access';
// import roomProvider from 'imports/modules/room/provider/';
import beamClient from 'imports/startup/server/beamClient';

import userAccess from 'imports/modules/user/access';

import { extractInitialsFromName } from 'imports/modules/user/utilities';

import response from 'imports/startup/server/response';

const updateRoom = (roomId, changeset) => {
  const result = Rooms.update(roomId, changeset);
  beamClient.pushRoomEvent(roomId, { payload: { type: 'ROOM_UPDATED' } });
  return result;
};

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

    // TODO: in case of a random room name I should try a different name
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

    if (!Rooms.insert(roomDocument)) return response.error(HttpStatus.INTERNAL_SERVER_ERROR, 'Internal server error 👹');

    // TODO
    // const providerMetadata = roomProvider.licode.createRoom(roomId, { p2p: true });
    // updateRoom(roomId, { $set: { providerMetadata } });

    return response.body(HttpStatus.CREATED, {
      roomId,
      roomName: roomSpecification.roomName,
      roomSecret,
      passwordEnabled,
      roomAccessToken: passwordEnabled ? roomAccess.createAccessToken(roomId) : null,
    });
  },

  lookupRoom(roomName) {
    check(roomName, String);
    const room = Rooms.findOne({ roomName, archived: false });
    if (!room) return response.error(HttpStatus.NOT_FOUND, 'Room not found');
    // be sure to filter for only relevent fields. dont send the whole doc lol.
    return response.body(HttpStatus.OK, _.pick(room, ['passwordEnabled', '_id', 'tabs', 'roomName']));
  },

  checkIfExistingUser(roomId, userToken) {
    check(roomId, String);
    check(userToken, String);

    const room = Rooms.findOne({ _id: roomId, archived: false });
    if (!room) return response.error(HttpStatus.EXPECTATION_FAILED, 'Room not found');
    const userId = userAccess.getUserId(userToken);

    return response.body(
      HttpStatus.OK,
      { existingUser: !!_.find(room.participants, { userId }) },
    );
  },

  unlockWithPassword(roomId, password) { // change to ID
    check(roomId, String);
    check(password, String);

    const roomDocument = Rooms.findOne({ _id: roomId, archived: false });
    if (!roomDocument) return response.error(HttpStatus.NOT_FOUND, 'Room not found');

    if (!roomAccess.comparePassword(password, roomDocument.password)) {
      return response.error(HttpStatus.UNAUTHORIZED, 'Incorrect room password 😕');
    }

    const roomAccessToken = roomAccess.createAccessToken(roomDocument._id);
    return response.body(
      HttpStatus.OK,
      { roomAccessToken },
    );
  },

  joinRoom(roomId, credentials, options) {
    check(roomId, String);
    check(credentials, Match.ObjectIncluding({
      roomSecret: String,
      roomAccessToken: String,
    }));
    check(options, Match.Maybe(Object));

    const { userToken, name, textAvatarColor } = options;
    check(name, Match.Maybe(String));
    check(textAvatarColor, Match.Maybe(String));
    check(userToken, Match.Maybe(String));

    const room = Rooms.findOne({ _id: roomId, archived: false });
    if (!room) response.error(HttpStatus.NOT_FOUND, 'Room not found');

    if (!roomAccess.areCredentialsValid(room, credentials)) {
      return response.error(HttpStatus.UNAUTHORIZED, 'Unauthorized');
    }

    // TODO
    const createErizoToken = _userId => '';
    // roomProvider.licode.createToken(room.providerMetadata, userId);

    if (userToken) {
      const userId = userAccess.getUserId(userToken);
      if (!_.find(room.participants, { userId })) {
        return response.error(HttpStatus.UNAUTHORIZED, 'Unauthorized');
      }
      return response.body(HttpStatus.OK, {
        erizoToken: createErizoToken(userId),
        userId,
        userToken,
        roomAccessToken: roomAccess.createAccessToken(roomId),
      });
    }

    const loggedInUser = Meteor.user();

    if (loggedInUser && _.find(room.participants, { userId: loggedInUser._id })) {
      const userId = loggedInUser._id;
      return response.body(HttpStatus.OK, {
        erizoToken: createErizoToken(userId),
        userId,
        userToken: userAccess.createToken(userId),
        roomAccessToken: roomAccess.createAccessToken(roomId),
      });
    }

    if (!name || !textAvatarColor) {
      return response.error(HttpStatus.BAD_REQUEST, 'Missing user name or avatar color');
    }

    const userId = loggedInUser ? loggedInUser._id : `[anon]${Random.id(12)}`;

    const generateProfile = (user = loggedInUser) => {
      let profile = {};
      if (user) {
        const initials = extractInitialsFromName(user.profile.firstName + user.profile.LastName);
        profile = Object.assign(profile, loggedInUser.profile, { initials });
      } else {
        profile = Object.assign(profile, {
          firstName: name.trim(),
          loginService: '',
          picture: '',
          initials: extractInitialsFromName(name),
        });
      }
      return Object.assign(profile, {
        userId,
        textAvatarColor,
      });
    };
    const profile = generateProfile();
    updateRoom(room._id, { $push: { participants: profile } });

    return response.body(HttpStatus.OK, {
      erizoToken: createErizoToken(userId),
      userId,
      userToken: userAccess.createToken(userId),
      roomAccessToken: roomAccess.createAccessToken(roomId),
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
    updateRoom(roomId, { $set: { tabs } });

    return response.body(HttpStatus.OK);
  },

  fetchRoom(roomId, credentials) {
    check(roomId, String);
    check(credentials, Match.ObjectIncluding({
      roomSecret: String,
      roomAccessToken: String,
    }));
    const room = Rooms.findOne({ _id: roomId, archived: false });

    if (!roomAccess.areCredentialsValid(room, credentials)) {
      return response.error(HttpStatus.UNAUTHORIZED, 'Unauthorized');
    }

    return response.body(HttpStatus.OK, _.pick(room, [
      '_id',
      'roomName',
      'defaultTab',
      'tabs',
      'participants',
      'createdAt',
      'roomSecret',
      'passwordEnabled',
    ]));
  },
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
