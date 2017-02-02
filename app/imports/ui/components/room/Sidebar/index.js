import React, { Component } from 'react';
import classNames from 'classnames';

import uiConfig from '../constants/uiConfig';

import './sidebar.scss';

// tabs
import Info from './tabs/Info';
import Settings from './tabs/Settings';

class Sidebar extends Component {

  constructor(props) {
    super(props);
    this.tabs = [
      {
        name: 'information',
        component: Info,
        bgColor: '#c2e078',
      },
      {
        name: 'settings',
        component: Settings,
        bgColor: '#45b29d',
      },
    ];

    this.state = {
      isVisible: false,
      activeTab: this.tabs[0],
    };

    this.closeSidebar = this.closeSidebar.bind(this);
  }

  closeSidebar() {
    // implement
    this.setState({
      ...this.state,
      isVisible: false,
    });
  }

  switchToTab(tab) {
    this.setState({
      ...this.state,
      activeTab: tab,
      isVisible: this.state.isVisible ? tab.name !== this.state.activeTab.name : true,
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

    const sidebarStyling = {
      boxShadow: `inset 5px -5px 0px ${activeTab.bgColor}`,
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
          className={classNames(switchClassNames)}
          id={tab.name}>
        </div>
      );
    };

    const renderTabContent = (tab) => {
      const isOnTop = tab.name === activeTab.name;
      return <tab.component key={tab.name} onTop={isOnTop}/>;
    };

    return (
      <div
        className={classNames(sidebarClassNames)}
        style={sidebarStyling} >
        <div id="close-sidebar" onClick={this.closeSidebar}>
        </div>
        <div className="content">
          {this.tabs.map(renderTabContent)}
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
