import React, { Component } from 'react';
import classNames from 'classnames';

import uiConfig from '../constants/uiConfig';

import './sidebar.scss';

class Sidebar extends Component {

  constructor(props) {
    super(props);
    this.tabs = [
      {
        name: 'info',
      },
      {
        name: 'messages',
      },
      {
        name: 'settings',
      },
    ];

    this.state = {
      isVisible: false,
      activeTab: this.tabs[0],
    };
  }

  switchToTab(tab) {
    this.setState({
      ...this.state,
      activeTab: tab,
    });
  }

  render() {
    const activeTab = this.state.activeTab;
    const { uiSize } = this.props;
    const sidebarClassNames = {
      sidebar: true,
      compact: uiSize === uiConfig.COMPACT,
      default: uiSize !== uiConfig.COMPACT,

      visible: this.state.isVisible,
    };

    const renderSwitch = (tab) => {
      const switchClassNames = {
        'anchor-button': true,
        active: tab.name === activeTab.name,
      };
      return (
        <div
          key={tab.name}
          onClick={() => { this.switchToTab(tab); }}
          className={classNames(switchClassNames)}>
        </div>
      );
    };
    return (
      <div className={classNames(sidebarClassNames)}>
        <div id="close-sidebar">
        </div>
        <div className="content">
        </div>
        <div className="content-switcher">
          {this.tabs.map(renderSwitch)}
        </div>
      </div>
    );
  }
}

Sidebar.propTypes = {
  uiSize: React.PropTypes.string.isRequired,
};


export default Sidebar;
