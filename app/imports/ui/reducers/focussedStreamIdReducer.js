import { FOCUS_STREAM } from '../actions/stream';

const defaultState = 0;

// streamId

export default function (state = defaultState, action) {
  switch (action.type) {
    case FOCUS_STREAM:
    default: return state;
  }
}
