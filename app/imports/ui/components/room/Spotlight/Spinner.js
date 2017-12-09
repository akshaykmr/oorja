import React, { Component } from 'react';
import PropTypes from 'prop-types';

import MinimalLogo from '../../MinimalLogo';

class Spinner extends Component {
  render() {
    if (!this.props.show) return null;
    return (
      <div className="syncSpinner spin-infinite">
        <MinimalLogo />
      </div>
    );
  }
}

Spinner.propTypes = {
  show: PropTypes.bool,
};

export default Spinner;
