import React, { Component } from 'react';
import { connect } from 'react-redux';


class Room extends Component {
  render() {
    return (
      <div>
      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Officia ab deserunt
       tempore consequuntur, sunt saepe eaque obcaecati ad consequatur quisquam sit
      vitae minus voluptate non amet eum cumque ea veritatis.
      </div>
    );
  }
}

export default connect(null, {})(Room);

