import React, { Component } from 'react';
import update from 'immutability-helper';
import { Intent } from '@blueprintjs/core';
import { Loading, PlusCircle, Check, AlertCircle } from 'imports/ui/components/Icons';

import tabPropTypes from '../tabPropTypes';
import SupremeToaster from '../../../../Toaster';
import './discoverTabs.scss';

/* eslint-disable */
import tabRegistry from '../../tabRegistry';
/* eslint-enable */

import tabStatus from '../../tabStatus';

class DiscoverTabs extends Component {
  constructor(props) {
    super(props);

    this.state = {
      fetchingData: false,
    };

    this.stateBuffer = this.state;
    this.updateState = this.updateState.bind(this);
    this.renderTabPreview = this.renderTabPreview.bind(this);
  }

  updateState(changes, buffer = this.stateBuffer) {
    this.stateBuffer = update(buffer, changes);
    this.setState(this.stateBuffer);
  }

  componentWillUnmount() {
    this.unmountInProgress = true;
  }

  renderTabPreview(tab) {
    if (tab.name === 'DiscoverTabs') return null;
    const localTab = this.props.tabStatusRegistry[tab.tabId];

    let icon = <PlusCircle />;
    let loading = false;
    let iconColor = '#1a7ecb';
    if (localTab) {
      const { status } = localTab;
      if (status === tabStatus.LOADED) {
        icon = <Check />;
        iconColor = 'darkseagreen';
      } else if (status === tabStatus.LOADING) {
        loading = true;
        icon = <Loading />;
      } else if (status === tabStatus.ERROR) {
        icon = <AlertCircle />;
        iconColor = 'palevioletred';
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
        this.props.switchToTab(tab.tabId);
        return;
      }
      this.props.addTabToRoom(tab.tabId);
    };
    return (
      <div key={tab.tabId} className="tabPreview">
        <div className="name">
          {tab.displayName}
        </div>
        <div className="description">
          {tab.description}
        </div>
        <div
          className={`status ${loading ? 'loading' : ''}`}
          style={{ color: iconColor }} onClick={handleClick}>
          {icon}
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
            {Object.keys(tabRegistry).map(tabId => this.renderTabPreview(tabRegistry[tabId]))}
          </div>
        </div>
      </div>
    );
  }
}

DiscoverTabs.propTypes = tabPropTypes;

export default DiscoverTabs;
