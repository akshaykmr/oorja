import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FocusStyleManager } from '@blueprintjs/core';

import { Route } from 'react-router-dom';

import Landing from 'imports/ui/pages/Landing/';
import Door from 'imports/ui/components/Door';
import NotFound from 'imports/ui/pages/NotFound';
import SupremeToaster from 'imports/ui/components/Toaster';


FocusStyleManager.onlyShowFocusOnTabs();


const onEnterDoor = (nextState, replace, callback) => {
  SupremeToaster.clear();
  callback();
};

class App extends Component {
  render() {
    return (
      <div>
        <div className="versionTag">
          <a href="https://github.com/akshayKMR/oorja" target="_blank" rel="noopener noreferrer">
            <strong>ALPHA</strong>
          </a>
        </div>

        <Route exact path="/" name="Landing" component={ Landing } />
        <Route path="/not-found" component={ NotFound }/>
        <Route path="/:roomName" component={ Door } onEnter={onEnterDoor} />
      </div>
    );
  }
}

App.propTypes = {
  history: PropTypes.object.isRequired,
};

export default App;
