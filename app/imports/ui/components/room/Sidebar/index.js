import React, { Component } from 'react';
import classNames from 'classnames';

import './sidebar.scss';

// tabs
import Info from './tabs/Info';
import Settings from './tabs/Settings';

class Sidebar extends Component {
  constructor(props) {
    super(props);


    this.tabDefaults = {
      bgColor: '#45b29d',
      iconColor: 'white',
    };

    this.closeButtonColor = 'aquamarine';

    this.tabs = [
      {
        name: 'information',
        component: Info,
        bgColor: '#2c3e50',
        iconColor: '',
      },
      {
        name: 'settings',
        component: Settings,
        bgColor: '#45b29d',
        iconColor: '',
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

    // change styling here for mobile later.
    const sidebarClassNames = {
      sidebar: true,
      visible: this.state.isVisible,
    };

    const renderSwitch = (tab, index) => {
      const switchClassNames = {
        switch: true,
        active: tab.name === activeTab.name,
      };
      const switchStyle = {
        backgroundColor: tab.bgColor || this.tabDefaults.bgColor,
        color: tab.iconColor || this.tabDefaults.iconColor,
        top: `${(index * 50).toString()} px`,
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
        backgroundColor: activeTab.bgColor || this.tabDefaults.bgColor,
      };
      return <tab.component key={tab.name}
        classNames={classNames(tabContentClassNames)}
        style={tabContentStyle}/>;
    };

    return (
      <div
        className={classNames(sidebarClassNames)} >
        <div id="close-sidebar"
          onClick={this.closeSidebar}
          style={{ backgroundColor: this.closeButtonColor }}
          >
          <i className="icon ion-ios-arrow-forward"></i>
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

export default Sidebar;
