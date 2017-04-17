import React, { Component } from 'react';
import { Collapse } from '@blueprintjs/core';

import './settings.scss';

class Settings extends Component {

  render() {
    return (
      <div className={this.props.classNames} style={this.props.style}>
        <div className="settingsContainer">
          <div className="setting">
            <div className="title">Media</div>
              <Collapse
                isOpen={true} >
                <div style={{ padding: '5px' }}>
                <label className="pt-label" htmlFor="roomPassword">Password</label>
                  <input className="pt-input" type="password" id="roomPassword"
                    value={''}
                  />
                </div>
              </Collapse>
          </div>
          <div className="setting">
            <div className="title">Room</div>
          </div>
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
