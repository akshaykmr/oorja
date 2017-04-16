import React, { Component } from 'react';
import Loading from '../../Loading';

class Spinner extends Component {
  render() {
    if (!this.props.show) return null;
    return (
      <div className="syncSpinner spin-infinite">
        <Loading />
      </div>
    );
  }
}

Spinner.propTypes = {
  show: React.PropTypes.bool,
};

export default Spinner;
