import update from 'immutability-helper';
import { SPEAKING, SPEAKING_STOPPED } from '../actions/streamSpeaking';

const defaultState = {};

// { streamId -> { speaking: bool } }

export default function (state = defaultState, action) {
  switch (action.type) {
    case SPEAKING:
      return update(state, {
        [action.payload.streamId]: {
          $set: true,
        },
      });
    case SPEAKING_STOPPED:
      return update(state, {
        [action.payload.streamId]: {
          $set: false,
        },
      });
    default: return state;
  }
}
