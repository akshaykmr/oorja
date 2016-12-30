import React, { Component } from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

// TODO css stuff.
class LoginWithService extends Component {
  constructor(props) {
    super(props);
    const user = Meteor.user();
    this.state = {
      loggedIn: !!user,
      loginService: user ? user.profile.loginService : null,
      waitingFor: '', // waiting for the service with 'name',
      hasLoggedOutOnce: false,
    };

    const loginCallback = this.loginCallback.bind(this);

    this.services = [
      { service: 'Google', login: () => Meteor.loginWithGoogle({}, loginCallback) },
      { service: 'Facebook', login: () => Meteor.loginWithFacebook({}, loginCallback) },
      { service: 'Twitter', login: () => Meteor.loginWithTwitter({}, loginCallback) },
      { service: 'LinkedIn', login: () => Meteor.loginWithLinkedIn({}, loginCallback) },
      { service: 'Github', login: () => Meteor.loginWithGithub({}, loginCallback) },
    ];
  }

  loginCallback() {
    this.setState({
      ...this.state,
      waitingFor: '',
    });
  }

  updateState(user) {
    this.setState({
      ...this.state,
      loggedIn: !!user,
      loginService: user ? user.profile.loginService : '',
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

    const setWaiting = (service) => {
      this.setState({
        ...this.state,
        waitingFor: service,
      });
    };

    return this.services.map(({ service, login }, index) => {
      let classes = 'example loginButton';
      if (loggedIn && loginService === service) {
        classes += ' active';
      }
      if (waitingFor === service) {
        classes += ' waiting';
      }
      const button = (
        <div key={index} className={classes} id={service}
          onClick={ loggedIn && loginService === service ? null : () => {
            setWaiting(service);
            login();
          }}>
        </div>
      );

      if (loggedIn) {
        return loginService === service ? button : null;
      }
      return button;
    });
  }

  loginInfo() {
    if (!this.state.loggedIn) {
      let text;
      if (this.state.hasLoggedOutOnce) {
        text = 'You have successfully logged out. you may login again with an account of your choice.';
      } else {
        text = `Alternatively, You may sign in with any of these online accounts to meet
          people with a username and/or a picture familiar to them.`;
      }
      return (
        <div className="login-info">
          <span>{text}</span>
        </div>
      );
    }
    const service = this.state.loginService;
    const greet = `Welcome, you are logged in with ${service}`;
    const logoutHandler = () => {
      Meteor.logout();
      this.setState({
        ...this.state,
        hasLoggedOutOnce: true,
      });
    };
    return (
      <div className="login-info">
        <span>{greet}</span>,
        <span><button onClick={logoutHandler}>logout</button></span>
      </div>
    );
  }

  render() {
    return (
      <div className='login-container'>
        <div className="button-container">
          <ReactCSSTransitionGroup
            transitionName="example"
            transitionEnterTimeout={2000}
            transitionLeaveTimeout={0}>
              {this.loginButtons()}
          </ReactCSSTransitionGroup>
        </div>
      {this.loginInfo()}
      </div>
    );
  }
}

export default LoginWithService;
