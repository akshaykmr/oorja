/* global window */

import React, { Component } from 'react';

import tabPropTypes from '../tabPropTypes';
import './blankSlate.scss';

class BlankSlate extends Component {
  render() {
    return (
      <div className={this.props.classNames} style={this.props.style}>
        <div className="joinUs">
        Are you a developer? You can extend functionality of oorja by developing a
        custom tab. oorja is open source and could use your skills !
        <br/> <br/>
        <a href="https://github.com/akshayKMR/oorja" target="_blank" rel="noopener noreferrer">Join us at GitHub 😎</a>
        <br/><br/>
        {`
          The tabs are react components using a simple but powerful mini-api
          (using props and some event listeners) to add more capabilities to the room.
          This is the coolest feature of this project.
          It aids in easily configurable rooms during creation with features relevant to your
          purpose, while also being able to add more later
          It's exciting to think of the tabs people will develop leveraging the
          super easy p2p interace/api in oorja.
        `}
        </div>
      </div>
    );
  }
}

BlankSlate.propTypes = tabPropTypes;

export default BlankSlate;
