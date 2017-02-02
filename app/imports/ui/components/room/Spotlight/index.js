import React, { Component } from 'react';
import classNames from 'classnames';

import uiConfig from '../constants/uiConfig';

import './spotlight.scss';

class Spotlight extends Component {

  constructor(props) {
    super(props);
    this.tabs = [
      {
        name: 'information',
        bgColor: '#c2e078',
      },
      {
        name: 'settings',
        bgColor: '#45b29d',
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
    const { uiSize } = this.props;
    const spotlightClassNames = {
      spotlight: true,
      compact: uiSize === uiConfig.COMPACT,
      default: uiSize !== uiConfig.COMPACT,

      visible: this.state.isVisible,
    };

    const spotlightStyling = {};

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

    // const renderTabContent = (tab) => {
    //   const isOnTop = tab.name === activeTab.name;
    //   return <tab.component key={tab.name} onTop={isOnTop}/>;
    // };

    return (
      <div
        className={classNames(spotlightClassNames)}
        style={spotlightStyling} >
        <div className="content">
          {/* this.tabs.map(renderTabContent) */ }
        </div>
        <div className="content-switcher">
          {this.tabs.map(renderSwitch)}
        </div>
      </div>
    );
  }
}

Spotlight.propTypes = {
  uiSize: React.PropTypes.string.isRequired,
};


export default Spotlight;
