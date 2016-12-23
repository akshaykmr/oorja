// React
import React from 'react';
import { render } from 'react-dom';
import { Router, Route, IndexRoute, browserHistory } from 'react-router';

// Redux related
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import ReduxPromise from 'redux-promise';
import ReduxThunk from 'redux-thunk';
import { syncHistoryWithStore } from 'react-router-redux';

// Meteor
import { Meteor } from 'meteor/meteor';

// components
import App from '../../ui/layouts/App.js';
import Landing from '../../ui/pages/Landing.js';
import Room from '../../ui/containers/Room';
import NotFound from '../../ui/pages/NotFound.js';

// root reducer
import rootReducer from '../../ui/reducers';

const createStoreWithMiddleware = applyMiddleware(ReduxThunk, ReduxPromise)(createStore);

/* eslint-disable no-underscore-dangle */
const store = createStoreWithMiddleware(rootReducer,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);
 /* eslint-enable */

const history = syncHistoryWithStore(browserHistory, store);

Meteor.startup(() => {
  render(
    <Provider store={store}
    >
      <Router history={ history }>
        <Route path="/" component={ App }>
          <IndexRoute name="Landing" component={ Landing } />
          <Route path="/room/:roomName" component={ Room } />
          <Route path="*" component={ NotFound } />
        </Route>
      </Router>
    </Provider>,
    document.getElementById('react-root')
  );
});
