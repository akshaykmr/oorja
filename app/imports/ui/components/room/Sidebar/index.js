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
        bgColor: '#2c3e50',
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

    // change styling here for mobile later.
    const sidebarClassNames = {
      sidebar: true,
      compact: uiSize === uiConfig.COMPACT,
      default: uiSize !== uiConfig.COMPACT,

      visible: this.state.isVisible,
    };

    const renderSwitch = (tab) => {
      const switchClassNames = {
        switch: true,
        active: tab.name === activeTab.name,
      };
      const switchStyle = {
        backgroundColor: tab.bgColor,
      };
      return (
        <div
          key={tab.name}
          onClick={() => { this.switchToTab(tab); }}
          className={classNames(switchClassNames)}
          style={switchStyle}
          id={tab.name}>
        </div>
      );
    };

    const renderTabContent = (tab) => {
      const tabContentClassNames = {
        content: true,
        onTop: tab.name === activeTab.name,
      };
      const tabContentStyle = {
        backgroundColor: activeTab.bgColor,
      };
      return <tab.component key={tab.name}
        classNames={classNames(tabContentClassNames)}
        style={tabContentStyle}/>;
    };

    return (
      <div
        className={classNames(sidebarClassNames)} >
        <div id="close-sidebar" onClick={this.closeSidebar}>
        </div>
        <div className="content-wrapper">
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
