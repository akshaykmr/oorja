import React, { Component } from 'react';

import tabPropTypes from '../tabPropTypes';
import './info.scss';

class Info extends Component {

  render() {
    return (
      <div className={this.props.classNames} style={this.props.style}>
        Info tab
        <br/>
        Room link and other stats go here.
      </div>
    );
  }
}

Info.propTypes = tabPropTypes;

export default Info;
