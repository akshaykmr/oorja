import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './sidebar.scss';

/*
  required prop: tabList = [
    {
      name: 'information',
      component: React Component,
      bgColor: '#2c3e50',
      icon: '', // currently only supports ionicons eg.`ion-android-arrow-dropright`
      iconColor: '',
    },
    ...
  ]
  these tabs are then rendered on the sidebar.
*/

class Sidebar extends Component {
  constructor(props) {
    super(props);


    this.tabDefaults = {
      bgColor: '#2e3136',
      iconColor: 'white',
    };

    this.closeButtonBgColor = this.props.closeButtonBgColor || '#3e606f';
    this.closeButtonColor = this.props.closeButtonColor || 'aquamarine';

    this.state = {
      isVisible: false,
      activeTab: this.props.tabList[0],
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
    const { activeTab } = this.state;

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
        top: `${(index * 50).toString()}px`,
      };
      return (
        <div
          key={tab.name}
          onClick={() => { this.switchToTab(tab); }}
          className={classNames(switchClassNames)}
          style={switchStyle}
          id={tab.name}>
          <i className={`icon ${tab.icon}`}></i>
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
      return <tab.component key={tab.name} {...tab.componentProps}
        classNames={classNames(tabContentClassNames)}
        style={tabContentStyle}/>;
    };

    return (
      <div
        className={classNames(sidebarClassNames)} >
        <div id="close-sidebar"
          onClick={this.closeSidebar}
          style={{ backgroundColor: this.closeButtonBgColor, color: this.closeButtonColor }}
          >
          <i className="icon ion-ios-arrow-forward"></i>
        </div>
        <div className="content-wrapper">
          {this.props.tabList.map(renderTabContent)}
        </div>
        <div className="content-switcher">
          {this.props.tabList.map(renderSwitch)}
        </div>
      </div>
    );
  }
}

Sidebar.propTypes = {
  closeButtonColor: PropTypes.string,
  closeButtonBgColor: PropTypes.string,
  tabList: PropTypes.array,
};

export default Sidebar;
