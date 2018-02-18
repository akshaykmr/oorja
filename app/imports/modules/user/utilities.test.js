/* global test */
import { extractInitialsFromName } from './utilities';

test('name initials', () => {
  expect(extractInitialsFromName('blah')).toBe('BL');
  expect(extractInitialsFromName('p')).toBe('P');
  expect(extractInitialsFromName('akshay kumar')).toBe('AK');
  expect(extractInitialsFromName('awesome sun rays')).toBe('AR');
});
