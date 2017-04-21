import React, { Component } from 'react';
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
  show: React.PropTypes.bool,
};

export default Spinner;
