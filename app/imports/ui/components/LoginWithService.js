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
      waitingFor: '', // waiting for the service with 'name'
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
      const imagePath = `/images/${service}.svg`;
      let classes = 'example loginButton';
      if (loggedIn && loginService === service) {
        classes += ' active';
      }
      if (waitingFor === service) {
        classes += ' waiting';
      }
      const button = (
        <div key={index} className={classes}
          onClick={ loggedIn && loginService === service ? null : () => {
            setWaiting(service);
            login();
          }}>
       <img src={imagePath} alt={service}/>
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
      return (
        <div className="login-info">
          <span>Alternatively, You may sign in with any of these online accounts and meet
          people with a picture and username familiar to them.</span>
        </div>
      );
    }
    const service = this.state.loginService;
    const greet = `Welcome, you are logged in with ${service}`;
    return (
      <div className="login-info">
        <span>{greet}</span>,
        <span><button onClick={() => { Meteor.logout(); }}>logout</button></span>
      </div>
    );
  }

  render() {
    return (
      <div className='login-container'>
      <ReactCSSTransitionGroup
        transitionName="example"
        transitionEnterTimeout={500}
        transitionLeaveTimeout={300}>
        {this.loginButtons()}
        {this.loginInfo()}
      </ReactCSSTransitionGroup>
      </div>
    );
  }
}

export default LoginWithService;
