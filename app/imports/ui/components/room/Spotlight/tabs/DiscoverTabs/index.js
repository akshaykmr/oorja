import React, { Component } from 'react';
import update from 'immutability-helper';
import _ from 'lodash';
import { Intent } from '@blueprintjs/core';

import { Meteor } from 'meteor/meteor';

import roomActivities from '../../../constants/roomActivities';

import tabPropTypes from '../tabPropTypes';
import SupremeToaster from '../../../../Toaster';
import './discoverTabs.scss';

class DiscoverTabs extends Component {

  constructor(props) {
    super(props);

    this.state = {
      tabList: [],
      fetchingData: false,
    };

    this.stateBuffer = this.state;
    this.fetchTabs = _.throttle(this.fetchTabs, 60000);
    this.updateState = this.updateState.bind(this);
    this.fetchTabs = this.fetchTabs.bind(this);
    if (props.onTop) {
      this.fetchTabs();
    }

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
        </div>
      </div>
    );
  }
}

DiscoverTabs.propTypes = tabPropTypes;

export default DiscoverTabs;
