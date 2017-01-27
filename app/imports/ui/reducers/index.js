import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import roomConfigurationReducer from './roomConfiguration';

const rootReducer = combineReducers({
  roomConfiguration: roomConfigurationReducer,
  /*
    do I really need this?
  */

  routing: routerReducer,
  /*
    Keep the router in sync with application state
    https://www.npmjs.com/package/react-router-redux
  */
});

export default rootReducer;
