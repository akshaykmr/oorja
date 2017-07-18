import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import bcrypt from 'bcrypt';
import _ from 'lodash';
import { moment as Moment } from 'meteor/momentjs:moment';
import jwt from 'jwt-simple';
import { Random } from 'meteor/random';

import sentencer from 'sentencer';

import { Rooms } from '../../../collections/common';
import N from '../../../modules/NuveClient/';
import tabRegistry from './tabRegistry';

const { private: { saltRounds, Nuve, JWTsecret, JWTalgo, tokenVersion } } = Meteor.settings;

N.API.init(Nuve.serviceId, Nuve.serviceKey, Nuve.host);

const hashPassword = Meteor.wrapAsync(bcrypt.hash);
const comparePassword = Meteor.wrapAsync(bcrypt.compare);

function validTokenPayload(payload, roomDocument) {
  const now = (new Moment()).toDate().getTime();
  return (payload.v === tokenVersion && payload.exp > now && roomDocument._id === payload.roomId);
}

// Common error handling
const PASS_TO_CLIENT = 'PASS_TO_CLIENT';
const GENERIC_ERROR_MESSAGE = 'Something went wrong... ☹️';


Meteor.methods({

  createRoom(options) {
    check(options, Match.Maybe(Object));

    const shareChoices = {
      SECRET_LINK: 'SECRET_LINK',
      PASSWORD: 'PASSWORD',
    };
    const defaultOptions = {
      roomName: '',
      shareChoice: shareChoices.SECRET_LINK,
      password: '',
    };
    const roomSpecification = options || defaultOptions;
    // error format : throw new Meteor.Error(errorTopic,reason, passToClient)
    const errorTopic = 'Failed to create Room';

    const checkIfValidRoomName = (roomName) => {
      const namePattern = /^[ @a-z0-9_-]+$/;
      if (!namePattern.test(roomName)) {
        throw new Meteor.Error(errorTopic, `Invalid Room Name: ${roomName}`);
      }
    };

    try {
      const validSpecification = Match.test(roomSpecification, {
        roomName: Match.Where((candidateName) => {
          check(candidateName, String);
          return candidateName.length < 50;
        }),
        shareChoice: Match.Where((choice) => {
          check(choice, String);
          return choice === shareChoices.SECRET_LINK || choice === shareChoices.PASSWORD;
        }),
        password: String,
      });

      if (!validSpecification) {
        throw new Meteor.Error(errorTopic, 'Invalid params for creating room', PASS_TO_CLIENT);
      }

      let { roomName } = roomSpecification;
      if (!roomName) { // generate randomly
        const template = '{{ adjective }}-{{ adjective }}-{{ nouns }}';
        roomName = sentencer.make(template);
      }
      roomName = roomName.trim();
      roomName = roomName.split('').map((char) => {
        if (char === ' ') {
          return '-';
        }
        return char;
      }).join('');
      checkIfValidRoomName(roomName);

      const passwordEnabled = roomSpecification.shareChoice === shareChoices.PASSWORD;
      const password = passwordEnabled ?
                        hashPassword(roomSpecification.password, saltRounds) : null;

      const roomSecret = !passwordEnabled ? Random.secret(20) : null;

      const now = new Moment();
      const nuveResponse = N.API.createRoom(roomName, { p2p: true });

      const defaultTabs = [1, 10, 100];
      const roomDocument = {
        _id: nuveResponse.data._id,
        NuveServiceName: Nuve.serviceName,
        owner: Meteor.userId() || null,
        roomName,
        defaultTabId: 1,
        tabs: defaultTabs.reduce((tabList, tabId) => {
          tabList.push(tabRegistry[tabId]);
          return tabList;
        }, []),
        passwordEnabled,
        roomSecret,
        password,
        userTokens: [],
        participants: [],
        createdAt: now.toDate().getTime(),
        validTill: now.add(4, 'days').toDate().getTime(),
        archived: false,
      };

      if (Rooms.findOne({ roomName, archived: false })) {
        throw new Meteor.Error(errorTopic, 'A room with same name exists (；一_一)', PASS_TO_CLIENT);
      }
      // Add schema validation later.
      const roomId = Rooms.insert(roomDocument);
      if (!roomId) {
        throw new Meteor.Error(errorTopic, 'Failed to create Room');
      }

      const response = {
        createdRoomName: roomName,
        roomSecret,
        passwordEnabled,
        roomAccessToken: passwordEnabled ? jwt.encode({
          v: tokenVersion,
          iat: roomDocument.createdAt,
          exp: roomDocument.validTill,
          roomId,
        }, JWTsecret, JWTalgo) : null,
      };
      return response;
    } catch (exception) {
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
    const room = Rooms.findOne({ roomName, archived: false });
    if (!room) {
      return null;
    }
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

    const tabs = room.tabs;
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
