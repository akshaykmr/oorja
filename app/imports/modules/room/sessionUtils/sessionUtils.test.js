/* global test */

import sessionUtils from './index';

test('session creation', () => {
  const session = sessionUtils.createSession('11124124');
  const parts = session.split(':');
  expect(parts[0]).toBe('11124124');
  expect(parts.length).toBe(2);
});

test('session unpack', () => {
  const session = '[anon]asd1311:202';
  const { userId, sessionId } = sessionUtils.unpack(session);
  expect(userId).toBe('[anon]asd1311');
  expect(sessionId).toBe('202');
});
