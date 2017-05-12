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
// import Settings from './tabs/Settings';
// import ExperimentTab from './tabs/ExperimentTab';
import QuillPad from './tabs/QuillPad';
import CodePad from './tabs/CodePad';
import Chat from './tabs/Chat';
import VideoChat from './tabs/VideoChat';
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
      10: VideoChat,
      // 30: Settings,
      40: QuillPad,
      41: CodePad,
      31: Chat,
      100: DiscoverTabs,
    };

    const defaultTabs = props.roomInfo.tabs;
    /* eslint-disable no-param-reassign*/
    const tabStatusRegistry = defaultTabs.reduce((registry, tab) => {
      registry[tab.tabId] = this.initialTabState(tab);
      return registry;
    }, {});
    /* eslint-enable no-param-reassign*/

    this.defaultTabId = this.props.roomInfo.defaultTabId;

    let tabFound = false;
    let lastActiveTabId = localStorage.getItem(`lastActiveTab:${props.roomInfo.roomName}`);
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
    const { activeTabId, tabStatusRegistry } = this.stateBuffer;
    const from = activeTabId;
    const to = tabId;
    this.updateState({
      activeTabId: { $set: tabId },
    });
    localStorage.setItem(`lastActiveTab:${this.props.roomInfo.roomName}`, tabId);
    this.props.dispatchRoomActivity(roomActivities.TAB_SWITCH, { from, to });
    const newActiveTab = tabStatusRegistry[tabId];
    this.props.setCustomStreamContainerSize(newActiveTab.streamContainerSize);
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
    const { uiSize } = this.props;

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
      <div className="spotlightContainer">
        <div
          className={classNames(spotlightClassNames)}>
          <div className="content-wrapper">
            {Object.keys(this.state.tabStatusRegistry).map(renderTabContent)}
          </div>
          <div className="content-switcher">
            <CSSTransitionGroup
                transitionName={switchTransition}
                transitionAppear={true}
                transitionAppearTimeout={1500}
                transitionEnterTimeout={1500}
                transitionLeaveTimeout={1000}>
                {Object.keys(this.state.tabStatusRegistry).map(renderSwitch)}
            </CSSTransitionGroup>
          </div>
        </div>
      </div>
    );
  }
}

Spotlight.propTypes = {
  roomAPI: React.PropTypes.object.isRequired,
  dispatchRoomActivity: React.PropTypes.func.isRequired,
  connectedUsers: React.PropTypes.array.isRequired,
  roomInfo: React.PropTypes.object.isRequired,
  uiSize: React.PropTypes.string.isRequired,
  streamContainerSize: React.PropTypes.string.isRequired,
  setCustomStreamContainerSize: React.PropTypes.func.isRequired,
};


export default Spotlight;
