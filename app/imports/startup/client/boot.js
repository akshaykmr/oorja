import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route } from 'react-router-dom';

// Redux related
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import ReduxPromise from 'redux-promise';
import ReduxThunk from 'redux-thunk';

import { onPageLoad } from 'meteor/server-render';

import App from 'imports/ui/layouts/App';

import rootReducer from 'imports/ui/reducers';


const createStoreWithMiddleware = applyMiddleware(ReduxThunk, ReduxPromise)(createStore);

/* eslint-disable */
const store = createStoreWithMiddleware(rootReducer,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);
 /* eslint-enable */

onPageLoad((_sink) => {
  ReactDOM.hydrate(
    <Provider store={store}>
      <Router>
        <Route path="/" component={ App } />
      </Router>
    </Provider>,
    document.getElementById('react-root'),
  );
});
