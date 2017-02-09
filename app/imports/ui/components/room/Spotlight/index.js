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
    this.tabs = [
      {
        name: 'information',
        component: Info,
        bgColor: '',
        color: '',
      },
      {
        name: 'settings',
        component: Settings,
        bgColor: '',
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
      return <tab.component
        key={tab.name}
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
          {this.tabs.map(renderTabContent)}
        </div>
        <div className="content-switcher default">
          {this.tabs.map(renderSwitch)}
        </div>
      </div>
    );
  }
}

Spotlight.propTypes = {
  uiSize: React.PropTypes.string.isRequired,
  streamContainerSize: React.PropTypes.string.isRequired,
};


export default Spotlight;
