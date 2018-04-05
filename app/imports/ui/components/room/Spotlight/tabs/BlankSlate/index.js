/* global window */

import React, { Component } from 'react';

import { Github, GitBranch } from 'imports/ui/components/icons';

import tabPropTypes from '../tabPropTypes';
import './blankSlate.scss';

class BlankSlate extends Component {
  render() {
    return (
      <div className={this.props.classNames} style={this.props.style}>
        <div className="fork">
          <div className="develop">
            <div className="icon"><Github /></div>
            <div className="label"> Develop your own tab! </div>
          </div>
          <div className="content">
            oorja is open source and free for personal use.
            It is built with React, WebRTC, Meteor and Elixir. <br/> <br/>
            It is extensible by design. The tabs are react components which utilize a simple but
            powerful mini-api (using props and some event listeners) to add more capabilities
            to the room on demand.
            <br/>
            <br/>
            <div className="iconAnchor">
              <GitBranch/><a href="https://github.com/akshayKMR/oorja" target="_blank" rel="noopener noreferrer"> Fork oorja at GitHub</a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

BlankSlate.propTypes = tabPropTypes;

export default BlankSlate;
