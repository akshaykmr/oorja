import React, { Component } from 'react';

class Info extends Component {
  render() {
    return (
      <div className={this.props.classNames} style={this.props.style}>
      Info tab
      </div>
    );
  }
}

Info.propTypes = {
  classNames: React.PropTypes.string,
  style: React.PropTypes.object,
};

export default Info;
