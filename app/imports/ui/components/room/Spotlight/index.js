import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import update from 'immutability-helper';
import classNames from 'classnames';
import { Position, Tooltip } from '@blueprintjs/core';

import uiConfig from '../constants/uiConfig';
import roomActivities from '../constants/roomActivities';

/* eslint-disable*/ // Dynamic imports in this file...
import tabRegistry from './tabRegistry';
/* eslint-enable */

import './spotlight.scss';

// tabs. only import those which need to be displayed instantly.
// rest are dynamically imported
import Info from './tabs/Info';

// constants
import tabStatus from './tabStatus';

class Spotlight extends Component {
  constructor(props) {
    super(props);

    this.fetchTabComponent = this.fetchTabComponent.bind(this);
    this.updateState = this.updateState.bind(this);
    this.initialTabState = this.initialTabState.bind(this);

    this.tabComponents = { // id -> reactComponent(tab)
      1: Info,
    };

    /* eslint-disable no-param-reassign */
    const tabStatusRegistry = props.roomInfo.tabs.reduce((registry, tabId) => {
      const tab = tabRegistry[tabId];
      const tabState = this.initialTabState(tab);
      if (tabState.status === tabStatus.INITIALIZING) {
        this.fetchTabComponent(tab.tabId);
        tabState.status = tabStatus.LOADING;
      }
      registry[tab.tabId] = tabState;

      return registry;
    }, {});
    /* eslint-enable no-param-reassign */

    this.defaultTabId = this.props.roomInfo.defaultTab;

    let tabFound = false;
    let lastActiveTabId = this.props.roomStorage.getLastActiveTab();
    lastActiveTabId = Number(lastActiveTabId);
    if (lastActiveTabId && tabStatusRegistry[lastActiveTabId]) {
      tabFound = true;
    }

    this.state = {
      // id -> tabState (high level state, such as tabStatus[loading,loaded etc.], badge etc.)
      tabStatusRegistry,
      activeTabId: tabFound ? lastActiveTabId : this.defaultTabId,
    };
    this.stateBuffer = this.state;
    function isTouchDevice() { return ('ontouchstart' in document.documentElement); }
    this.touchDevice = isTouchDevice();
    this.switchToTab = this.switchToTab.bind(this);
    this.addTabToRoom = this.addTabToRoom.bind(this);
  }

  initialTabState(tab) {
    return {
      ...tab,
      // is the tab component loaded ?
      status: this.tabComponents[tab.tabId] ? tabStatus.LOADED : tabStatus.INITIALIZING,

      // badge shown alongside switch
      badge: {
        content: '', // upto 2 chars preferable, more wouldn't look good imo
        visible: false,
        backgroundColor: '',
      },
      // glowing animation for the tab switch | for some added ux or something
      glow: false,
    };
  }


  updateState(changes, buffer = this.stateBuffer) {
    this.stateBuffer = update(buffer, changes);
    this.setState(this.stateBuffer);
  }

  switchToTab(tabId) {
    const { activeTabId, tabStatusRegistry } = this.stateBuffer;
    const from = activeTabId;
    const to = tabId;
    this.updateState({
      activeTabId: { $set: tabId },
    });
    this.props.roomStorage.saveLastActiveTab(tabId);
    this.props.dispatchRoomActivity(roomActivities.TAB_SWITCH, { from, to });
    const newActiveTab = tabStatusRegistry[tabId];
    this.props.setCustomStreamContainerSize(newActiveTab.streamContainerSize);
  }

  /*
    nextProps
  */
  componentWillReceiveProps(nextProps) {
    const currentTabList = this.props.roomInfo.tabs;
    const newTabList = nextProps.roomInfo.tabs;
    if (currentTabList.length === newTabList.length) return;

    newTabList.forEach((tabId) => {
      const tab = tabRegistry[tabId];
      if (this.state.tabStatusRegistry[tabId]) return;

      const tabState = this.initialTabState(tab);
      if (tabState.status === tabStatus.INITIALIZING) {
        tabState.status = tabStatus.LOADING;
      }
      this.updateState({
        tabStatusRegistry: {
          [tabId]: { $set: tabState },
        },
      });
      this.fetchTabComponent(tabId);
    });
  }

  fetchTabComponent(tabId, switchAfterFetch = false) {
    const tab = tabRegistry[tabId];

    // when fetch component was callled
    const thenActiveTabId = switchAfterFetch ? this.stateBuffer.activeTabId : null;

    tab.load()
      .then((module) => {
        const tabComponent = module.default;
        this.tabComponents[tabId] = tabComponent;
        this.updateState({
          tabStatusRegistry: {
            [tabId]: { status: { $set: tabStatus.LOADED } },
          },
        });
        const currentActiveTabId = this.stateBuffer.activeTabId;
        if (switchAfterFetch && (thenActiveTabId === currentActiveTabId)) this.switchToTab(tabId);
      });
  }

  addTabToRoom(tabId) {
    const tab = tabRegistry[tabId];
    const tabState = this.initialTabState(tab);
    tabState.status = tabStatus.LOADING;
    this.updateState({
      tabStatusRegistry: {
        [tabId]: { $set: tabState },
      },
    });
    if (tab.local) {
      this.fetchTabComponent(tabId, true);
      return;
    }
    this.props.oorjaClient.addTab(this.props.roomInfo._id, tabId)
      .then(() => { this.fetchTabComponent(tabId, true); });
  }

  render() {
    const { tabStatusRegistry, activeTabId } = this.state;
    const activeTab = tabStatusRegistry[activeTabId];
    const { uiSize, roomReady } = this.props;

    // change styling here for mobile later.
    const spotlightClassNames = {
      spotlight: true,
      compact: uiSize === uiConfig.COMPACT,
      default: uiSize !== uiConfig.COMPACT,
    };

    const renderSwitch = (tabId) => {
      const tab = tabStatusRegistry[tabId];
      if (tab.status !== tabStatus.LOADED || (tab.tabId !== 1 && !roomReady)) return null;
      const onTop = tab.tabId === activeTab.tabId;
      const switchClassNames = {
        switch: true,
        active: onTop,
      };
      const switchStyle = {
        backgroundColor: '#1b1d1e',
        color: onTop ? '#45b29d' : 'white', // tab.iconColor:white
      };

      const renderBadge = () => {
        const { content } = tab.badge;
        let { backgroundColor } = tab.badge;
        if (!backgroundColor) {
          backgroundColor = content ? '#1b1d1e' : 'orange';
        }

        if (tab.badge.visible) {
          return (
            <span
              style={{ backgroundColor }}
              className={classNames({ badge: true, empty: !content })}>
              {content}
            </span>
          );
        }
        return null;
      };

      const renderBox = () => (
        <div className="box">
          {renderBadge()}
          <div
            onClick={() => { this.switchToTab(tab.tabId); }}
            className="tabIcon"
            style={switchStyle}>
            <tab.icon />
          </div>
        </div>
      );

      const switchTransition = uiSize === uiConfig.LARGE ? 'switch' : 'switch-alt';
      // FIXME: tooltip is broken
      return (
        <CSSTransition
          key={tab.tabId}
          classNames={switchTransition}
          appear={true}
          timeout={{ enter: 1200, exit: 800 }}>
            <Tooltip
              content={tab.description}
              target={renderBox()}
              popoverClassName="pt-popover-content-sizing"
              position={uiSize === uiConfig.COMPACT ? Position.TOP : Position.RIGHT}
              hoverOpenDelay={500}
              className={classNames(switchClassNames)}>
            </Tooltip>
        </CSSTransition>
      );
    };

    const renderTabContent = (tabId) => {
      const tab = tabStatusRegistry[tabId];
      if (tab.status !== tabStatus.LOADED || (tab.tabId !== 1 && !roomReady)) return null;
      const onTop = tab.tabId === activeTab.tabId;
      const tabContentClassNames = {
        content: true,
        onTop,
        compact: this.props.uiSize === uiConfig.COMPACT,
      };
      tabContentClassNames[tab.name] = true;


      const tabContentStyle = {
        backgroundColor: tab.bgColor || '#36393e', // defaults, move them to settings later.
        borderTopLeftRadius: this.props.uiSize !== uiConfig.COMPACT ? '5px' : '0px',
        borderColor: '#2e3136',
      };

      const updateBadge = (badgeState) => {
        this.updateState({
          tabStatusRegistry: {
            [tabId]: { badge: { $merge: badgeState } },
          },
        });
      };

      const TabComponent = this.tabComponents[tab.tabId];
      return <TabComponent
        key={tab.tabId}
        tabInfo={tab}
        updateBadge={updateBadge.bind(this)}
        switchToTab={this.switchToTab}
        addTabToRoom={this.addTabToRoom}
        tabStatusRegistry={this.state.tabStatusRegistry}
        roomInfo={this.props.roomInfo}
        roomReady={this.props.roomReady}
        connectedUsers={this.props.connectedUsers}
        roomAPI={this.props.roomAPI}
        setTabReady={() => { }} // TODO
        uiSize={this.props.uiSize}
        onTop={onTop}
        touchDevice={this.touchDevice}
        primaryMediaStreamState={this.props.primaryMediaStreamState}
        screenSharingStreamState={this.props.screenSharingStreamState}
        classNames={classNames(tabContentClassNames)}
        style={tabContentStyle}/>;
    };

    return (
      <div className="spotlightContainer">
        <div
          className={classNames(spotlightClassNames)}>
          <div className="content-wrapper">
            {Object.keys(this.state.tabStatusRegistry).map(renderTabContent)}
          </div>
          <div className="content-switcher">
            <TransitionGroup>
              {Object.keys(this.state.tabStatusRegistry).map(renderSwitch)}
            </TransitionGroup>
          </div>
        </div>
      </div>
    );
  }
}

Spotlight.propTypes = {
  roomAPI: PropTypes.object.isRequired,
  dispatchRoomActivity: PropTypes.func.isRequired,
  connectedUsers: PropTypes.array.isRequired,
  roomInfo: PropTypes.object.isRequired,
  oorjaClient: PropTypes.object.isRequired,
  roomStorage: PropTypes.object.isRequired,
  roomReady: PropTypes.bool.isRequired,
  uiSize: PropTypes.string.isRequired,
  streamContainerSize: PropTypes.string.isRequired,
  setCustomStreamContainerSize: PropTypes.func.isRequired,
  primaryMediaStreamState: PropTypes.object.isRequired,
  screenSharingStreamState: PropTypes.object.isRequired,
};


export default Spotlight;
