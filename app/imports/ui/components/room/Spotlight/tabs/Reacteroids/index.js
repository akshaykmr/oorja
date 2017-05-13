import React, { Component } from 'react';
// import { Intent } from '@blueprintjs/core';

// import { Meteor } from 'meteor/meteor';

// import roomActivities from '../../../constants/roomActivities';

import tabPropTypes from '../tabPropTypes';
// import SupremeToaster from '../../../../Toaster';
import { Reacteroids as Game } from './src/Reacteroids';
import './Reacteroids.scss';

// import tabStatus from '../../tabStatus';

// todo properly destroy game if not rendering.
class Reacteroids extends Component {


  componentWillUnmount() {
    this.unmountInProgress = true;
  }

  render() {
    return (
      <div className={this.props.classNames} style={this.props.style}>
        <Game paused = {!this.props.onTop} />
      </div>
    );
  }
}

Reacteroids.propTypes = tabPropTypes;

export default Reacteroids;
