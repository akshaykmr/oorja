import React, { Component } from 'react';
// import { Intent } from '@blueprintjs/core';


import tabPropTypes from '../tabPropTypes';
// import SupremeToaster from '../../../../Toaster';
import { Reacteroids as Game } from './src/Reacteroids';
import './Reacteroids.scss';


class Reacteroids extends Component {
  render() {
    return (
      <div className={this.props.classNames} style={this.props.style}>
        <Game
          onTop={this.props.onTop}
          roomAPI={this.props.roomAPI}
          tabId={this.props.tabInfo.tabId}/>
      </div>
    );
  }
}

Reacteroids.propTypes = tabPropTypes;

export default Reacteroids;
