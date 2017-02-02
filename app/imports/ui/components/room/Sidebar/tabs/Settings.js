import React, { Component } from 'react';

class Settings extends Component {
  render() {
    return (
      <div className={this.props.classNames} style={this.props.style}>
      Settings tab
      </div>
    );
  }
}

Settings.propTypes = {
  classNames: React.PropTypes.string,
  style: React.PropTypes.object,
};

export default Settings;
