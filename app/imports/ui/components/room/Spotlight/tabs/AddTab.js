import React, { Component } from 'react';

import tabPropTypes from './tabPropTypes';

class AddTab extends Component {

  render() {
    return (
      <div className={this.props.classNames} style={this.props.style}>
        AddTab tab
        <br/>
        Dynamically load other tabs from server for added functionality.
        ( React components using room api )
      </div>
    );
  }
}

AddTab.propTypes = tabPropTypes;

export default AddTab;
