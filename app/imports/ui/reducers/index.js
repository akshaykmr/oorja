import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import mediaStreamsReducer from './mediaStream';
import streamSpeakingReducer from './streamSpeaking';

const rootReducer = combineReducers({
  /*
    I dont think I'll be needing this for the Room. passing down props along
    with roomAPI and roomActivityListner is working well. Still keeeping it here in case I need it
    later.
  */

  /*
    move state here if:
    `1. if a particular state is changing too often and
     2. if not many components(on the way down) need access to it or
     3. those who do may be quite deep.
    makes sense to move it here and connect it wherever required to avoid extra computation.
  */
  mediaStreams: mediaStreamsReducer,

  streamSpeaking: streamSpeakingReducer,

  routing: routerReducer,
  /*
    Keep the router in sync with application state
    https://www.npmjs.com/package/react-router-redux
  */
});

export default rootReducer;
