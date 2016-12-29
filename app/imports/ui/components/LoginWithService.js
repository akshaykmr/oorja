import React, { Component } from 'react';

import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import HorizontalLoading from '../components/HorizontalLoading';

class LoginWithService extends Component {
  constructor(props) {
    super(props);
    const user = Meteor.user();
    this.state = {
      loggedIn: !!user,
      loginService: user ? user.profile.loginService : null,
      waitingFor: '', // waiting for the service with 'name'
    };

    this.services = [
      { name: 'Google', login: Meteor.loginWithGoogle },
      { name: 'Facebook', login: Meteor.loginWithFacebook },
      { name: 'Twitter', login: Meteor.loginWithTwitter },
      { name: 'LinkedIn', login: Meteor.loginWithLinkedIn },
      { name: 'Github', login: Meteor.loginWithGithub },
    ];
  }
  updateState(user = Meteor.user()) {
    this.setState({
      ...this.state,
      loggedIn: !!user,
      loginService: user ? user.profile.loginService : null,
    });
  }

  componentWillMount() {
    this.loginStatusTracker = Tracker.autorun(() => {
      const user = Meteor.user();
      this.updateState(user);
    });
  }

  componentWillUnmount() {
    // cleanup
    this.loginStatusTracker.stop();
  }

  loginButtons() {
    const { loggedIn, waitingFor, loginService } = this.state;
    const getButton = () => (
      <div key={index} className="loginButton">
        <img src={imagePath} alt={service}/>
      </div>
    );
    return this.services.map((service, index) => {
      const imagePath = `/images/${service}.svg`;

      if (!loggedIn) {
        return (

        );
      }
    });
  }

  loginInfo() {
    let text;
    if (!this.state.loggedIn) {
      text = [
        <span>Alternatively, You may sign in with any of these online accounts and meet
        people with a picture and username familiar to them.</span>,
      ];
    } else {
      const service = this.state.loginService;
      const greet = `Welcome, you are logged in with ${service}`;
      text = [
        <span>{greet}</span>,
        <span><button>logout</button></span>,
      ];
    }

    return (
      <div className="login-info">
        {text}
      </div>
    );
  }

  render() {
    return (
      <div className='login-container'>
      { this.loginInfo() }
      </div>
    );
  }
}

export default LoginWithService;
