/* global location*/

import React, { Component } from 'react';

import tabPropTypes from '../tabPropTypes';
import './blankSlate.scss';

class BlankSlate extends Component {

  render() {
    return (
      <div className={this.props.classNames} style={this.props.style}>
        <p>
        Are you a developer? You can extend functionality of oorja by developing a
        custom tab. oorja is open source and could use your skills !
        <br/>
        <a href="https://github.com/akshayKMR/oorja" target="_blank">Join us at GitHub</a>
        </p>
      </div>
    );
  }
}

BlankSlate.propTypes = tabPropTypes;

export default BlankSlate;
