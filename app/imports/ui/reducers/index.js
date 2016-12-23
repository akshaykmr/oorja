import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import roomConfigurationReducer from './roomConfiguration';

const rootReducer = combineReducers({
  roomConfiguration: roomConfigurationReducer,
  /*
    roomConfiguration will be responsible for components loaded in the room
    eg. video, voice, files, chat, spotlight etc.

    when creating a new room
     - the state drives the ui preview thingy.
     - this state will be sent to the server on form submit.

    when entering a room, this state will be cleared and loaded through
    a server call that responds with the room configuration.

    should be reset to default state upon
      - exiting the room
      - loading indexRoute
  */

  /* roomSettings will be responsible for personalized settings for room occupants
  eg.  layout adjustment etc.
  */

  routing: routerReducer,
  /*
    Keep the router in sync with application state
    https://www.npmjs.com/package/react-router-redux
  */
});

export default rootReducer;
