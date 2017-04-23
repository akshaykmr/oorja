import React, { Component } from 'react';
import classNames from 'classnames';
import _ from 'lodash';

import { Popover, PopoverInteractionKind, Position } from '@blueprintjs/core';

import uiConfig from '../constants/uiConfig';
import roomActivities from '../constants/roomActivities';

import './spotlight.scss';
import Spinner from './Spinner';

// tabs
import Info from './tabs/Info';
import Settings from './tabs/Settings';
// import ExperimentTab from './tabs/ExperimentTab';
import QuillPad from './tabs/QuillPad';
import CodePad from './tabs/CodePad';
import Chat from './tabs/Chat/';
import AddTab from './tabs/AddTab';

class Spotlight extends Component {

  constructor(props) {
    super(props);

    this.tabComponents = {  // id -> reactComponent(tab)
      1: Info,
      2: Settings,
      3: QuillPad,
      4: CodePad,
      5: Chat,
      6: AddTab,
    };

    const defaultTabs = [ // default tabs
      {
        tabId: 1,
        name: 'Info',
        iconColor: '#fffad5',
        bgColor: '#ffffff',
        icon: 'android-share-alt',
        description: 'Invite others to this room',
      },
      {
        tabId: 2,
        name: 'Settings',

        iconColor: '#acf0f2',
        ContentBgColor: '',
        bgColor: '',
        icon: 'ios-settings',
        description: 'Configure your webcam and Room settings',
      },
      {
        tabId: 3,
        name: 'QuillPad',

        iconColor: '#fff0a5',
        bgColor: '#ffffff',
        icon: 'document-text',
        description: 'Shared Richtext document',
      },
      {
        tabId: 4,
        name: 'CodePad',

        iconColor: 'turquoise',
        bgColor: '',
        icon: 'code-working',
        description: 'Shared Code editor',
      },
      {
        tabId: 5,
        name: 'Chat',
        iconColor: '#9ac16e',
        bgColor: '#faebd7',
        icon: 'chatbubbles',
        description: 'Chat',
      },
      {
        tabId: 6,
        name: 'AddTab',
        iconColor: '#7dd3f5',
        bgColor: '',
        icon: 'ios-plus',
        description: 'Discover more tabs',
      },
    ];

    const lastActiveTab = localStorage.getItem(`lastActiveTab:${props.roomInfo.roomName}`);
    const lastActiveTabIndex = _.findIndex(defaultTabs, { name: lastActiveTab });
    const tabFound = lastActiveTabIndex > -1;

    this.state = {
      tabs: defaultTabs,
      activeTab: defaultTabs[tabFound ? lastActiveTabIndex : 0],
    };
  }

  switchToTab(tab) {
    const from = this.state.activeTab.tabId;
    const to = tab.tabId;
    this.setState({
      ...this.state,
      activeTab: tab,
    });
    localStorage.setItem(`lastActiveTab:${this.props.roomInfo.roomName}`, tab.name);
    this.props.dispatchRoomActivity(roomActivities.TAB_SWITCH, { from, to });
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
      const onTop = tab.name === activeTab.name;
      const switchClassNames = {
        switch: true,
        active: onTop,
      };
      const switchStyle = {
        backgroundColor: '#1b1d1e',
        color: onTop ? '#45b29d' : 'white', // tab.iconColor:white
      };
      return (
        <Popover
          key={tab.name}
          content={tab.description}
          interactionKind={PopoverInteractionKind.HOVER}
          popoverClassName="pt-popover-content-sizing"
          position={uiSize === uiConfig.COMPACT ? Position.TOP : Position.RIGHT}
          className={classNames(switchClassNames)}
          hoverOpenDelay={800}>
          <div
            onClick={() => { this.switchToTab(tab); }}
            style={switchStyle}
            id={tab.name}>
            <i className={`icon ion-${tab.icon}`}></i>
          </div>
        </Popover>
      );
    };

    const renderTabContent = (tab) => {
      const onTop = tab.name === activeTab.name;
      const tabContentClassNames = {
        content: true,
        onTop,
        compact: this.props.uiSize === uiConfig.COMPACT,
      };
      tabContentClassNames[tab.name] = true;


      const tabContentStyle = {
        backgroundColor: tab.bgColor || '#36393e', // defaults, move them to settings later.
      };

      const TabComponent = this.tabComponents[tab.tabId];
      return <TabComponent
        key={tab.name}
        tabInfo={tab}
        roomInfo={this.props.roomInfo}
        connectedUsers={this.props.connectedUsers}
        roomAPI={this.props.roomAPI}
        uiSize={this.props.uiSize}
        onTop={onTop}
        Spinner={Spinner}
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
        <div className="content-switcher">
          {this.state.tabs.map(renderSwitch)}
        </div>
      </div>
    );
  }
}

Spotlight.propTypes = {
  roomAPI: React.PropTypes.object,
  dispatchRoomActivity: React.PropTypes.func,
  connectedUsers: React.PropTypes.array,
  roomInfo: React.PropTypes.object,
  uiSize: React.PropTypes.string.isRequired,
  streamContainerSize: React.PropTypes.string.isRequired,
};


export default Spotlight;
