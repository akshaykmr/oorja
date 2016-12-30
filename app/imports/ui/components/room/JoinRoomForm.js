import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

// inputs user name and joins the room.
class JoinRoomForm extends Component {

  constructor(props) {
    super(props);
    // if user is already logged in I can get their profile info
    // on the server. no need to get them here.
    this.state = this.initialState();

    this.handleNameChange = this.handleNameChange.bind(this);
  }

  initialState(user = Meteor.user()) {
    return {
      loggedIn: !!user,
      name: user ? `${user.profile.firstName} ${user.profile.lastName}` : '',
      picture: user ? user.profile.picture : null,
    };
  }

  componentWillMount() {
    this.loginStatusTracker = Tracker.autorun(() => {
      const user = Meteor.user();
      if (user) {
        this.updateStateForLogin(user);
      } else {
        this.setState(this.initialState());
      }
    });
  }

  updateStateForLogin(user) {
    const { firstName, lastName, picture } = user.profile;
    let name = firstName;
    if (lastName) {
      name += ` ${lastName}`;
    }
    this.setState({
      loggedIn: true,
      name,
      picture,
    });
  }

  componentWillUnmount() {
    // cleanup
    this.loginStatusTracker.stop();
  }

  handleNameChange(event) {
    this.setState({
      ...this.state,
      name: event.target.value,
    });
  }

  render() {
    const { name, loggedIn } = this.state;
    const attr = {
      disabled: loggedIn,
      value: name,
      onChange: this.handleNameChange,
    };
    return (
      <form action="">
      <div>
        <div></div>
        <div> <input type="text" {...attr}/> </div>
      </div>
      </form>
    );
  }
}

export default connect(null, null)(JoinRoomForm);
