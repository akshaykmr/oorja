// React
import React from 'react';
import { render } from 'react-dom';
import { Router, Route, IndexRoute, browserHistory } from 'react-router';

// Redux related
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import ReduxPromise from 'redux-promise';
import ReduxThunk from 'redux-thunk';

// Meteor
import { Meteor } from 'meteor/meteor';

// components
import App from '../../ui/layouts/App.js';
import Landing from '../../ui/pages/Landing.js';
import NotFound from '../../ui/pages/NotFound.js';

// root reducer
import rootReducer from '../../ui/reducers';

const createStoreWithMiddleware = applyMiddleware(ReduxThunk, ReduxPromise)(createStore);

Meteor.startup(() => {
  render(
    <Provider store={createStoreWithMiddleware(rootReducer)}>
      <Router history={ browserHistory }>
        <Route path="/" component={ App }>
          <IndexRoute name="Landing" component={ Landing } />
          <Route path="*" component={ NotFound } />
        </Route>
      </Router>
    </Provider>,
    document.getElementById('react-root')
  );
});
