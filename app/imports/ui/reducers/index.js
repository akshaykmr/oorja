import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

// import roomConfigurationReducer from './roomConfiguration';
import mediaStreamsReducer from './mediaStream';

const rootReducer = combineReducers({
  /*
    I dont think I'll be needing this for the Room. passing down props along
    with roomAPI and roomActivityListner is working well. Still keeeping it here in case I need it
    later.
  */

  /*
    moved media stream state here as they change very often ( esp. speaking: bool),
    not many components need access to it and those who do may be quite deep,
    makes sense to move it here and connect it wherever required to avoid extra computation.
  */
  mediaStreams: mediaStreamsReducer,
  routing: routerReducer,
  /*
    Keep the router in sync with application state
    https://www.npmjs.com/package/react-router-redux
  */
});

export default rootReducer;
