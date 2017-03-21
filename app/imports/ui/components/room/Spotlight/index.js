import React, { Component } from 'react';
import classNames from 'classnames';

import uiConfig from '../constants/uiConfig';

import './spotlight.scss';

// tabs
import Info from './tabs/Info';
import Settings from './tabs/Settings';

class Spotlight extends Component {

  constructor(props) {
    super(props);

    this.tabComponents = {  // id -> reactComponent(tab)
      1: Info,
      2: Settings,
    };

    const defaultTabs = [ // default tabs
      {
        tabId: 1,
        name: 'information',
        bgColor: '',
        color: '',
      },
      {
        tabId: 2,
        name: 'settings',
        bgColor: '',
      },
    ];

    this.state = {
      isVisible: false,
      tabs: defaultTabs,
      activeTab: defaultTabs[0],
    };
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
    const { uiSize, streamContainerSize } = this.props;

    // change styling here for mobile later.
    const spotlightClassNames = {
      spotlight: true,
      compact: uiSize === uiConfig.COMPACT,
      default: uiSize !== uiConfig.COMPACT,
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
      const onTop = tab.name === activeTab.name;
      const tabContentClassNames = {
        content: true,
        onTop,
      };
      const tabContentStyle = {
        backgroundColor: tab.bgColor || '#36393e', // defaults, move them to settings later.
        color: tab.color || '#fefefe',
      };

      const TabComponent = this.tabComponents[tab.tabId];
      return <TabComponent
        key={tab.name}
        tabInfo={tab}
        roomInfo={this.props.roomInfo}
        connectedUsers={this.props.connectedUsers}
        roomAPI={this.props.roomAPI}
        onTop={onTop}
        classNames={classNames(tabContentClassNames)}
        style={tabContentStyle}/>;
    };

    return (
      <div
        className={classNames(spotlightClassNames)}
        // move to config if it feels good
        style={{ height: streamContainerSize === uiConfig.LARGE ? '82%' : 'calc(100% - 60px)' }} >
        <div className="content-wrapper">
          {this.state.tabs.map(renderTabContent)}
        </div>
        <div className="content-switcher default">
          {this.state.tabs.map(renderSwitch)}
        </div>
      </div>
    );
  }
}

Spotlight.propTypes = {
  roomAPI: React.PropTypes.object,
  connectedUsers: React.PropTypes.array,
  roomInfo: React.PropTypes.object,
  uiSize: React.PropTypes.string.isRequired,
  streamContainerSize: React.PropTypes.string.isRequired,
};


export default Spotlight;
