import { check, Match } from 'meteor/check';
import sentencer from 'sentencer';
import utilities from './utilities';
import constants, { shareChoices } from './constants';

export const validateRoomSpecification = roomSpecification =>
  Match.test(roomSpecification, {
    roomName: Match.Where((candidateName) => {
      check(candidateName, String);
      return candidateName.length < 50;
    }),
    shareChoice: Match.Where((choice) => {
      check(choice, String);
      return choice === shareChoices.SECRET_LINK || choice === shareChoices.PASSWORD;
    }),
    defaultTab: Match.Integer,
    tabs: Match.Where(tabList => tabList.every(i => Number.isSafeInteger(i))),
    password: String,
  });

export const getRandomRoomName = () => {
  const template = '{{ adjective }}-{{ adjective }}-{{ nouns }}';
  return sentencer.make(template);
};

export const getDefaultParameters = () => ({
  roomName: '',
  shareChoice: shareChoices.SECRET_LINK,
  password: '',
  defaultTab: 1,
  tabs: [1, 10, 100],
});


export default {
  utilities,
  constants,
  validateRoomSpecification,
  getRandomRoomName,
  getDefaultParameters,
};
