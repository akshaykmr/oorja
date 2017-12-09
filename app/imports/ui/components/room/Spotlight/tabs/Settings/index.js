import React, { Component } from 'react';
import PropTypes from 'prop-types';

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
  classNames: PropTypes.string,
  style: PropTypes.object,
  onTop: PropTypes.bool.isRequired,
};

export default Settings;
