import React, { Component } from 'react';

import tabPropTypes from './tabPropTypes';

class Info extends Component {

  render() {
    return (
      <div className={this.props.classNames} style={this.props.style}>
        Info tab
      </div>
    );
  }
}

Info.propTypes = tabPropTypes;

export default Info;
