import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FocusStyleManager } from '@blueprintjs/core';

import './app.scss';


FocusStyleManager.onlyShowFocusOnTabs();

class App extends Component {
  render() {
    return (
      <div>
        <div className="versionTag">
          <a href="https://github.com/akshayKMR/oorja" target="_blank" rel="noopener noreferrer">
            <strong>ALPHA</strong>
          </a>
        </div>
        {this.props.children}
      </div>
    );
  }
}

App.propTypes = {
  children: PropTypes.object,
  location: PropTypes.object,
};

export default App;
