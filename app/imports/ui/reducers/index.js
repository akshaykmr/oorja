import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

// import roomConfigurationReducer from './roomConfiguration';

const rootReducer = combineReducers({
  /*
    I dont think I'll be needing this for the Room. passing down props along
    with roomAPI and roomActivityListner is working well. Still keeeping it here in case I need it
    later.
  */
  routing: routerReducer,
  /*
    Keep the router in sync with application state
    https://www.npmjs.com/package/react-router-redux
  */
});

export default rootReducer;
