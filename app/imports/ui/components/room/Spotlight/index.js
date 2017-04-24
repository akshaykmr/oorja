import React, { Component } from 'react';
import update from 'immutability-helper';
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
import DiscoverTabs from './tabs/DiscoverTabs';

// constants
import tabStatus from './tabStatus';

class Spotlight extends Component {

  constructor(props) {
    super(props);

    this.updateState = this.updateState.bind(this);
    this.initialTabState = this.initialTabState.bind(this);

    this.tabComponents = {  // id -> reactComponent(tab)
      1: Info,
      2: Settings,
      3: QuillPad,
      4: CodePad,
      5: Chat,
      6: DiscoverTabs,
    };

    const defaultTabs = props.roomInfo.tabs;
    /* eslint-disable arrow-body-style */
    const tabListState = defaultTabs.map(this.initialTabState);
    /* eslint-enable arrow-body-style */

    const lastActiveTab = localStorage.getItem(`lastActiveTab:${props.roomInfo.roomName}`);
    const lastActiveTabIndex = _.findIndex(defaultTabs, { name: lastActiveTab });
    const tabFound = lastActiveTabIndex > -1;

    this.state = {
      tabs: tabListState,
      activeTabIndex: tabFound ? lastActiveTabIndex : 0,
    };
    this.stateBuffer = this.state;
  }

  initialTabState(tab) {
    return {
      ...tab,
      // is the tab component loaded ?
      status: this.tabComponents[tab.tabId] ? tabStatus.LOADED : tabStatus.LOADING,

      // badge shown alongside switch
      badge: {
        content: '', // 2 characters max.
        color: '',
        visible: false,
      },
      // glowing animation for the tab switch | for some added ux or something
      glow: false,
    };
  }

  updateState(changes, buffer = this.stateBuffer) {
    this.stateBuffer = update(buffer, changes);
    this.setState(this.stateBuffer);
  }

  switchToTab(tabIndex) {
    const { activeTabIndex, tabs } = this.state;
    const from = tabs[activeTabIndex].tabId;
    const to = tabs[tabIndex].tabId;
    this.updateState({
      activeTabIndex: { $set: tabIndex },
    });
    localStorage.setItem(`lastActiveTab:${this.props.roomInfo.roomName}`, tabs[tabIndex].name);
    this.props.dispatchRoomActivity(roomActivities.TAB_SWITCH, { from, to });
  }

  /*
    nextProps
  */
  componentWillReceiveProps() {
    // find if any new tabs were added
    // by finding difference between props.roomInfo.tabs with nextProps.roomInfo.tabs
    // for each of these tabs, get their initalState and push it to state.tabs
  }

  /*
    prevProps, prevState
  */
  componentDidUpdate() {
    this.fetchComponents();
  }

  fetchComponents() {
    // for each tab in LOADING state, fetch that tab component from server,
    // dynamic import with promise
    // insert it to this.tabComponents and set tab state to LOADED
  }

  componentDidMount() {
    this.fetchComponents();
  }

  render() {
    const { tabs, activeTabIndex } = this.state;
    const activeTab = tabs[activeTabIndex];
    const { uiSize, streamContainerSize } = this.props;

    // change styling here for mobile later.
    const spotlightClassNames = {
      spotlight: true,
      compact: uiSize === uiConfig.COMPACT,
      default: uiSize !== uiConfig.COMPACT,
    };

    const renderSwitch = (tab, tabIndex) => {
      if (tab.status !== tabStatus.LOADED) return null;
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
            onClick={() => { this.switchToTab(tabIndex); }}
            style={switchStyle}
            id={tab.name}>
            <i className={`icon ion-${tab.icon}`}></i>
          </div>
        </Popover>
      );
    };

    const renderTabContent = (tab) => {
      if (tab.status !== tabStatus.LOADED) return null;
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
        tabs={this.state.tabs}
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
