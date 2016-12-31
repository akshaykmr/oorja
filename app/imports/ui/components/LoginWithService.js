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
      // comment the service if not needed.
      // make changes to LoginWithService.scss as well to align the buttons.
      { service: 'Google', login: () => Meteor.loginWithGoogle({}, loginCallback) },
      { service: 'Facebook', login: () => Meteor.loginWithFacebook({}, loginCallback) },
      { service: 'Twitter', login: () => Meteor.loginWithTwitter({}, loginCallback) },
      { service: 'LinkedIn', login: () => Meteor.loginWithLinkedIn({}, loginCallback) },
      { service: 'Github', login: () => Meteor.loginWithGithub({}, loginCallback) },
      { service: 'Twitch', login: () => Meteor.loginWithTwitch({}, loginCallback) },
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
      let detailText;

      if (this.state.hasLoggedOutOnce) {
        text = 'You have successfully logged out.';
        detailText = `You may login again with an account of your choice to meet
         people with a username and/or a picture familiar to them.`;
      } else {
        text = `Alternatively, You may sign in with any of these online accounts to meet
          people with a username and/or a picture familiar to them.`;
      }
      return (
        <span className='animate fade-in'>{text} {detailText ? <br /> : null } {detailText}</span>
      );
    }
    const service = this.state.loginService;
    const greet = `Welcome, you are logged in with ${service}.`;
    const message = 'If you wish to use a different account of yours, you may logout.';
    const logoutHandler = () => {
      Meteor.logout();
      this.setState({
        ...this.state,
        hasLoggedOutOnce: true,
      });
    };
    return (
      <div className="animate fade-in">
        <div>{greet}</div>
        <div className='animate fade-in'>{message}</div>
        <div><button onClick={logoutHandler}>logout</button></div>
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
        <div className="login-info">
          {this.loginInfo()}
        </div>
      </div>
    );
  }
}

export default LoginWithService;
