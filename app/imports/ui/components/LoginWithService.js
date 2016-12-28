import React, { Component } from 'react';

import { Meteor } from 'meteor/meteor';

class LoginWithService extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loggedIn: !!Meteor.user(),
    };
  }
}

export default LoginWithService;
