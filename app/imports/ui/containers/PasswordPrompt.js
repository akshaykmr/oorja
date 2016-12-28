import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Intent } from '@blueprintjs/core';
import SupremeToaster from '../components/Toaster';

import { checkPassword } from '../actions/roomConfiguration';

class PasswordPrompt extends Component {
  constructor(props) {
    super(props);

    this.state = {
      password: '',
      tries: 0,
      waiting: false,
      authSuccess: false,
    };
  }

  handleChange(event) {
    this.setState({
      ...this.state,
      password: event.target.value,
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.setState({
      ...this.state,
      waiting: true,
    });
    this.props.checkPassword(this.props.roomName, this.state.password).then(
      (roomSecret) => {
        if (!roomSecret) {
          SupremeToaster.show({
            message: 'Incorrect password',
            intent: Intent.WARNING,
            timeout: 4000,
          });
        } else {
          this.setState({
            ...this.state,
            authSuccess: true,
          });

          setTimeout(() => {
            this.props.onSuccess();
          }, 1000);
        }
        this.setState({
          ...this.state,
          password: '',
          waiting: false,
          tries: this.state.tries + 1,
        });
      }
    );
  }

  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit.bind(this)}>
          <input
            value={this.state.password}
            onChange={this.handleChange.bind(this)}
            type="password"
          />
          <button type="submit">submit</button>
        </form>
      </div>
    );
  }
}

PasswordPrompt.propTypes = {
  checkPassword: React.PropTypes.func.isRequired,
  onSuccess: React.PropTypes.func.isRequired,
  roomName: React.PropTypes.string,
};

export default connect(null, { checkPassword })(PasswordPrompt);
