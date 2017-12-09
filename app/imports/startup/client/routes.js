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
import App from '../../ui/layouts/App';
import SupremeToaster from '../../ui/components/Toaster';
import Landing from '../../ui/pages/Landing/';
import Door from '../../ui/containers/Door';
import NotFound from '../../ui/pages/NotFound';

// root reducer
import rootReducer from '../../ui/reducers';


const createStoreWithMiddleware = applyMiddleware(ReduxThunk, ReduxPromise)(createStore);

/* eslint-disable */
const store = createStoreWithMiddleware(rootReducer,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);
 /* eslint-enable */

const history = syncHistoryWithStore(browserHistory, store);


const onEnterDoor = (nextState, replace, callback) => {
  SupremeToaster.clear();
  callback();
};

Meteor.startup(() => {
  render(
    <Provider store={store}>
      <Router history={ history }>
        <Route path="/" component={ App }>
          <IndexRoute name="Landing" component={ Landing } />
          <Route path="/not-found" component={ NotFound }/>
          <Route path="/:roomName" component={ Door } onEnter={onEnterDoor} />
        </Route>
      </Router>
    </Provider>,
    document.getElementById('react-root'),
  );
});
