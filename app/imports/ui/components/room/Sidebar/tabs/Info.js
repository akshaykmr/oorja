import React, { Component } from 'react';

class Info extends Component {
  render() {
    return (
      <div>
      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dolorem sapiente sequi eos esse consequuntur, non, temporibus perspiciatis voluptatem omnis magnam ex aliquam obcaecati eum nihil quidem autem tenetur doloremque. A.
      </div>
    );
  }
}

Info.propTypes = {
  onTop: React.PropTypes.bool.isRequired,
};

export default Info;
