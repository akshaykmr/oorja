import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Meteor } from 'meteor/meteor';
import classNames from 'classnames';

import './LoginWithService.scss';

class LoginWithService extends Component {
  constructor(props) {
    super(props);
    this.state = {
      waitingFor: '', // waiting for the service with 'name',
      hasLoggedOutOnce: false,
    };

    const loginCallback = this.loginCallback.bind(this);

    this.services = [
      // comment the service if not needed.
      {
        service: 'Google',
        login: () => Meteor.loginWithGoogle({}, loginCallback),
        icon: 'ion-googly',
        color: '#dd4b39',
      },
      {
        service: 'Facebook',
        login: () => Meteor.loginWithFacebook({}, loginCallback),
        icon: 'ion-book-of-faces',
        color: '#3b5998',
      },
      {
        service: 'Twitter',
        login: () => Meteor.loginWithTwitter({}, loginCallback),
        icon: 'ion-blue-birdy',
        color: '#1da1f2',
      },
      {
        service: 'LinkedIn',
        login: () => Meteor.loginWithLinkedIn({}, loginCallback),
        icon: 'ion-spam-central',
        color: '#0077b5',
      },
      {
        service: 'Github',
        login: () => Meteor.loginWithGithub({}, loginCallback),
        icon: 'ion-git-hub',
        color: '#24292e',
      },
      {
        service: 'Twitch',
        login: () => Meteor.loginWithTwitch({}, loginCallback),
        icon: 'ion-twitchy',
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

  renderLoginButtons() {
    const { waitingFor } = this.state;
    const { loggedIn, loginService } = this.props;
    if (loggedIn) {
      return null;
    }

    return this.services.map(({
      service, login, icon, color,
    }, index) => {
      const loginButtonClasses = classNames({
        loginButton: true,
        active: loggedIn && loginService === service,
        waiting: waitingFor === service,
      });

      const button = (
        <div key={index} className={loginButtonClasses}
          style={{ color }}
          onClick={ loggedIn && loginService === service ? null : () => {
            this.setState({
              ...this.state,
              waitingFor: service,
            });
            login();
          }}>
          <i className={`icon custom-ion ${icon}`}></i>
        </div>
      );
      return button;
    });
  }

  render() {
    return (
      <div className={`login-container ${this.props.extraClasses}`}>
        <div className={`button-container ${this.props.loggedIn ? 'hidden' : ''}`}>
          {this.renderLoginButtons()}
        </div>
      </div>
    );
  }
}

LoginWithService.propTypes = {
  loggedIn: PropTypes.bool.isRequired,
  loginService: PropTypes.string,
  extraClasses: PropTypes.string,
};

export default LoginWithService;
