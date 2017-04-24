import React, { Component } from 'react';
import update from 'immutability-helper';
import _ from 'lodash';
import { Intent } from '@blueprintjs/core';

import { Meteor } from 'meteor/meteor';

import roomActivities from '../../../constants/roomActivities';

import tabPropTypes from '../tabPropTypes';
import SupremeToaster from '../../../../Toaster';
import './discoverTabs.scss';

import tabStatus from '../../tabStatus';

class DiscoverTabs extends Component {

  constructor(props) {
    super(props);

    this.state = {
      tabList: [],
      fetchingData: false,
    };

    this.stateBuffer = this.state;
    this.fetchTabs = _.throttle(this.fetchTabs, 6000);
    this.updateState = this.updateState.bind(this);
    this.fetchTabs = this.fetchTabs.bind(this);
    this.renderTabPreview = this.renderTabPreview.bind(this);

    props.roomAPI.addActivityListener(roomActivities.TAB_SWITCH, ({ to }) => {
      if (to === props.tabInfo.tabId) {
        this.fetchTabs();
      }
    });
  }

  updateState(changes, buffer = this.stateBuffer) {
    this.stateBuffer = update(buffer, changes);
    this.setState(this.stateBuffer);
  }

  componentDidMount() {
    if (this.props.onTop) {
      this.fetchTabs();
    }
  }

  fetchTabs() { // make range based later | or somthings like infinite scroll
    this.updateState({ fetchingData: { $set: true } });
    Meteor.callPromise('getTabList')
      .then(
        (tabList) => {
          this.updateState({ fetchingData: { $set: false }, tabList: { $set: tabList } });
        },
        () => {
          SupremeToaster.show({
            message: 'Could not retrieve tabs from server 😕',
            intent: Intent.WARNING,
          });
        }
      );
  }

  renderTabPreview(tab) {
    if (tab.name === 'DiscoverTabs') return null;
    const localTab = _.find(this.props.tabs, { tabId: tab.tabId });
    let icon = 'ion-plus-circled';
    let loading = false;
    let iconColor = '#1a7ecb';
    if (localTab) {
      const status = localTab.status;
      if (status === tabStatus.LOADED) {
        icon = 'ion-ios-checkmark';
        iconColor = 'darkseagreen';
      } else if (status === tabStatus.LOADING) {
        loading = true;
        icon = 'ion-load-d';
      }
    }

    const handleClick = () => {
      if (loading) {
        SupremeToaster.show({
          message: 'please wait for the tab to load 😷',
          intent: Intent.PRIMARY,
        });
        return;
      } else if (localTab) {
        SupremeToaster.show({
          message: 'This tab is already part of the room',
          intent: Intent.PRIMARY,
        });
        return;
      }
      // TODO: call meteor method to add this tab to the room.
    };
    return (
      <div
        key={tab.tabId}
        className="tabPreview">
        <div className="name">
          {tab.displayName}
        </div>
        <div className="description">
          {tab.description}
        </div>
        <div
          className={`status ${loading ? 'spin-infinite' : ''}`}
          style={{ color: iconColor }} onClick={handleClick}>
          <i className={`icon ${icon}`}></i>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className={this.props.classNames} style={this.props.style}>
        <div className="container">
          <div className="title">
            <div className="heading">
              Discover more tabs
            </div>
            <div className="description">
              tabs allow you to add more functionality to your room 🚀
            </div>
          </div>
          <div className="tabList">
            {this.state.tabList.map(this.renderTabPreview)}
          </div>
        </div>
      </div>
    );
  }
}

DiscoverTabs.propTypes = tabPropTypes;

export default DiscoverTabs;
