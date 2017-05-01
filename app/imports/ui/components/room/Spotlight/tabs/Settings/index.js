import React, { Component } from 'react';
import { Collapse } from '@blueprintjs/core';

import './settings.scss';

class Settings extends Component {

  render() {
    return (
      <div className={this.props.classNames} style={this.props.style}>
        <div className="settingsContainer">
        WORK ON SETTINGS
        </div>
      </div>
    );
  }
}

Settings.propTypes = {
  classNames: React.PropTypes.string,
  style: React.PropTypes.object,
  onTop: React.PropTypes.bool.isRequired,
};

export default Settings;
