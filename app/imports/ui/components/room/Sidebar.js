import React, { Component } from 'react';

class Sidebar extends Component {
  render() {
    return (
      <div className="sidebar">
        <div id="close-sidebar">
        </div>
        <div className="content">
        </div>

        <div className="content-switcher">
          <div className="anchor-button" id="messages">
          </div>
          <div className="anchor-button" id="information">
          </div>
          <div className="anchor-button" id="settings">
          </div>
        </div>
      </div>
    );
  }
}

export default Sidebar;
