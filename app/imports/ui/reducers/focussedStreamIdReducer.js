import { FOCUS_STREAM } from '../actions/stream';
import { MEDIASTREAMS_RESET } from '../actions/mediaStreams';

const defaultState = 0;

// streamId

export default function (state = defaultState, action) {
  switch (action.type) {
    case FOCUS_STREAM:
    case MEDIASTREAMS_RESET:
      return defaultState;
    default: return state;
  }
}
