import React, { Component } from 'react';
// import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';

import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import classNames from 'classnames';

import './LoginWithService.scss';

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
      {
        service: 'Google',
        login: () => Meteor.loginWithGoogle({}, loginCallback),
        icon: 'ion-social-googleplus',
        color: '#dd4b39',
      },
      {
        service: 'Facebook',
        login: () => Meteor.loginWithFacebook({}, loginCallback),
        icon: 'ion-social-facebook',
        color: '#3b5998',
      },
      {
        service: 'Twitter',
        login: () => Meteor.loginWithTwitter({}, loginCallback),
        icon: 'ion-social-twitter',
        color: '#1da1f2',
      },
      {
        service: 'LinkedIn',
        login: () => Meteor.loginWithLinkedIn({}, loginCallback),
        icon: 'ion-social-linkedin',
        color: '#0077b5',
      },
      {
        service: 'Github',
        login: () => Meteor.loginWithGithub({}, loginCallback),
        icon: 'ion-social-github',
        color: '#24292e',
      },
      {
        service: 'Twitch',
        login: () => Meteor.loginWithTwitch({}, loginCallback),
        icon: 'ion-social-twitch',
        color: '#6441a4',
      },
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

  renderLoginButtons() {
    const { loggedIn, waitingFor, loginService } = this.state;
    if (loggedIn) {
      return null;
    }

    return this.services.map(({ service, login, icon }, index) => {
      const loginButtonClasses = classNames({
        loginButton: true,
        active: loggedIn && loginService === service,
        waiting: waitingFor === service,
      });

      const button = (
        <div key={index} className={loginButtonClasses} id={service}
          onClick={ loggedIn && loginService === service ? null : () => {
            this.setState({
              ...this.state,
              waitingFor: service,
            });
            login();
          }}>
          <i className={`icon ${icon}`}></i>
        </div>
      );
      return button;
    });
  }

  loginInfo() {
    if (!this.state.loggedIn) {
      const text = 'Sign in';
      /* if (this.state.hasLoggedOutOnce) {
        text = 'You have successfully signed out.';
      } else {
        text = ';
      }*/
      return (
        <span className='animate fade-in'>{text}</span>
      );
    }
    const service = this.state.loginService;
    const greet = `Welcome, you are signed in with ${service} `;
    const logoutHandler = () => {
      Meteor.logout();
      this.setState({
        ...this.state,
        hasLoggedOutOnce: true,
      });
    };
    return (
      <div className="animate fade-in">
        <span>{greet}</span>
        <span>
          <button type="button" className="pt-button" onClick={logoutHandler}>logout</button>
        </span>
      </div>
    );
  }

  render() {
    return (
      <div className={`login-container ${this.props.extraClasses}`}>
        <div className="login-info" style={{ fontSize: this.state.loggedIn ? '1.0em' : '1.3em' }}>
          {this.loginInfo()}
        </div>
        <div className={`button-container ${this.state.loggedIn ? 'hidden' : ''}`}>
          {this.renderLoginButtons()}
        </div>
      </div>
    );
  }
}

LoginWithService.propTypes = {
  extraClasses: React.PropTypes.string,
};

export default LoginWithService;
