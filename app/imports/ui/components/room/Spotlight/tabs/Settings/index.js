import React, { Component } from 'react';

import './settings.scss';

class Settings extends Component {
  render() {
    return (
      <div className={this.props.classNames} style={this.props.style}>
      Settings tab
      <br/>
      Configure user preferences. such as webcam/mic/ui etc.
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
