import update from 'immutability-helper';
import { MEDIASTREAMS_RESET, MEDIASTREAMS_UPDATE } from '../actions/mediaStreams';

const defaultState = {};

// { streamId -> mediaStreamState, ... }
/* e.g.
    {
      12: {
        streamId: Number,
        local: bool,
        audio: bool,
        video: bool,
        status: status[TRYING_TO_CONNECT, ERROR, CONNECTED etc.]
        screen: bool,
        streamSource: '', // mediStream object
        errorReason: '',
        warningReason: ''
        speaking: bool,
      },
      ...
    }
  */

export default function (state = defaultState, action) {
  switch (action.type) {
    case MEDIASTREAMS_RESET:
      return {};
    case MEDIASTREAMS_UPDATE:
      return update(state, action.payload.changes);
    default: return state;
  }
}
