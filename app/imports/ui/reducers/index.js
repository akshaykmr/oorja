import { combineReducers } from 'redux';

import mediaStreamsReducer from './mediaStream';
import streamSpeakingReducer from './streamSpeaking';

const rootReducer = combineReducers({
  /*
    I dont think I'll be needing this for the Room. passing down props along
    with roomAPI and roomActivityListner is working well. Still keeeping it here in case I need it
    later.
  */
  mediaStreams: mediaStreamsReducer,

  streamSpeaking: streamSpeakingReducer,
});

export default rootReducer;
