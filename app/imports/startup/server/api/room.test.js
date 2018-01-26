/* global test */

import { checkIfValidRoomName } from './roomUtilities';

test('room name validation', () => {
  expect(checkIfValidRoomName('blah')).toBe(true);
  expect(checkIfValidRoomName('@playgound')).toBe(true);
  expect(checkIfValidRoomName('2daystheday')).toBe(true);
  expect(checkIfValidRoomName('__hi__')).toBe(true);
  expect(checkIfValidRoomName('a:D')).toBe(false);
  expect(checkIfValidRoomName('asd asd')).toBe(false);
  expect(checkIfValidRoomName('asd-asd')).toBe(true);
});
