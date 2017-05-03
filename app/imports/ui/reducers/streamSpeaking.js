import update from 'immutability-helper';
import { SPEAKING, SPEAKING_STOPPED } from '../actions/stream';
import { MEDIASTREAMS_RESET } from '../actions/mediaStreams';

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
    case MEDIASTREAMS_RESET:
      return {};
    default: return state;
  }
}
