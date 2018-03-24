// A user can have multiple sessions open (web, mobile, another tab),
// a session identifier is used to differentiate between them

import _ from 'lodash';

const sessionUtils = {
  createSession(userId) {
    return `${userId}:${_.random(10000)}`;
  },
  unpack(session) {
    const [userId, sessionId] = session.split(':');
    return { userId, sessionId };
  },
};

export default sessionUtils;
