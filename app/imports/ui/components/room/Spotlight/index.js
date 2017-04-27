import React, { Component } from 'react';
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';
import update from 'immutability-helper';
import classNames from 'classnames';

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
    /* eslint-disable no-param-reassign*/
    const tabStatusRegistry = defaultTabs.reduce((registry, tab) => {
      registry[tab.tabId] = this.initialTabState(tab);
      return registry;
    }, {});
    /* eslint-enable no-param-reassign*/

    let tabFound = false;
    let lastActiveTabId = localStorage.getItem(`lastActiveTab:${props.roomInfo.roomName}`);
    if (lastActiveTabId && tabStatusRegistry[lastActiveTabId]) {
      tabFound = true;
      lastActiveTabId = Number(lastActiveTabId);
    }

    this.state = {
      // id -> tabState (high level state, such as tabStatus[loading,loaded etc.], badge etc.)
      tabStatusRegistry,
      activeTabId: tabFound ? lastActiveTabId : 1,
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
    const { activeTabId } = this.state;
    const from = activeTabId;
    const to = tabId;
    this.updateState({
      activeTabId: { $set: tabId },
    });
    localStorage.setItem(`lastActiveTab:${this.props.roomInfo.roomName}`, tabId);
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
    const { tabStatusRegistry, activeTabId } = this.state;
    const activeTab = tabStatusRegistry[activeTabId];
    const { uiSize, streamContainerSize } = this.props;

    // change styling here for mobile later.
    const spotlightClassNames = {
      spotlight: true,
      compact: uiSize === uiConfig.COMPACT,
      default: uiSize !== uiConfig.COMPACT,
    };

    const renderSwitch = (tabId) => {
      const tab = tabStatusRegistry[tabId];
      if (tab.status !== tabStatus.LOADED) return null;
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
        let backgroundColor = tab.badge.backgroundColor;
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
      return (
        <Popover
          key={tab.tabId}
          content={tab.description}
          interactionKind={PopoverInteractionKind.HOVER}
          popoverClassName="pt-popover-content-sizing"
          position={uiSize === uiConfig.COMPACT ? Position.TOP : Position.RIGHT}
          className={classNames(switchClassNames)}
          hoverOpenDelay={800}>
          <div className="box">
            {renderBadge()}
            <div
              onClick={() => { this.switchToTab(tab.tabId); }}
              className="tabIcon"
              style={switchStyle}>
              <i className={`icon ion-${tab.icon}`}></i>
            </div>
          </div>
        </Popover>
      );
    };

    const renderTabContent = (tabId) => {
      const tab = tabStatusRegistry[tabId];
      if (tab.status !== tabStatus.LOADED) return null;
      const onTop = tab.tabId === activeTab.tabId;
      const tabContentClassNames = {
        content: true,
        onTop,
        compact: this.props.uiSize === uiConfig.COMPACT,
      };
      tabContentClassNames[tab.name] = true;


      const tabContentStyle = {
        backgroundColor: tab.bgColor || '#36393e', // defaults, move them to settings later.
      };

      const updateBadge = (badgeState) => {
        this.updateState({
          tabStatusRegistry: {
            tabId: { $set: { $merge: badgeState } },
          },
        });
      };

      const TabComponent = this.tabComponents[tab.tabId];
      return <TabComponent
        key={tab.tabId}
        tabInfo={tab}
        updateBadge={updateBadge.bind(this)}
        tabStatusRegistry={this.state.tabStatusRegistry}
        roomInfo={this.props.roomInfo}
        connectedUsers={this.props.connectedUsers}
        roomAPI={this.props.roomAPI}
        uiSize={this.props.uiSize}
        onTop={onTop}
        Spinner={Spinner}
        classNames={classNames(tabContentClassNames)}
        style={tabContentStyle}/>;
    };

    const switchTransition = uiSize === uiConfig.LARGE ? 'switch' : 'switch-alt';

    return (
      <div
        className={classNames(spotlightClassNames)}
        // move to config if it feels good
        style={{ height: streamContainerSize === uiConfig.LARGE ? '82%' : 'calc(100% - 60px)' }} >
        <div className="content-wrapper">
          {
            Object.keys(this.state.tabStatusRegistry)
            .map(idString => Number(idString))
            .map(renderTabContent)
          }
        </div>
        <div className="content-switcher">
          <CSSTransitionGroup
              transitionName={switchTransition}
              transitionAppear={true}
              transitionAppearTimeout={1500}
              transitionEnterTimeout={1500}
              transitionLeaveTimeout={1000}>
              {
                Object.keys(this.state.tabStatusRegistry)
                .map(idString => Number(idString))
                .map(renderSwitch)
              }
          </CSSTransitionGroup>
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
