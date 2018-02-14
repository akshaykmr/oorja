import React, { Component } from 'react';
import PropTypes from 'prop-types';

import * as HttpStatus from 'http-status-codes';

import { Intent, Button } from '@blueprintjs/core';

import './passwordForm.scss';

const GENERIC_ERROR_MESSAGE = 'Something went wrong 😕';

class PasswordPrompt extends Component {
  constructor(props) {
    super(props);

    this.state = {
      password: '',
      tries: 0,
      waiting: false,
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleServerResponse = this.handleServerResponse.bind(this);
  }

  handleChange(event) {
    this.setState({
      ...this.state,
      password: event.target.value,
    });
  }

  handleServerResponse(response) {
    if (response.status !== HttpStatus.OK) {
      this.props.toaster.show({
        message: response.message,
        intent: Intent.WARNING,
        timeout: 4000,
      });
      this.setState({
        ...this.state,
        password: '',
        waiting: false,
        tries: this.state.tries + 1,
      });
      return;
    }

    this.props.onSuccess();
  }


  handleServerError() {
    this.props.toaster.show({
      message: GENERIC_ERROR_MESSAGE,
      intent: Intent.WARNING,
      timeout: 2000,
    });
    this.setState({
      ...this.state,
      password: '',
      waiting: false,
      tries: 0,
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.setState({
      ...this.state,
      waiting: true,
    });
    this.props.oorjaClient.unlockWithPassword(this.props.roomId, this.state.password)
      .then(
        this.handleServerResponse,
        this.handleServerError,
      );
  }

  render() {
    return (
      <div className="passwordFormContainer">
        <div className="passwordForm">
          <form onSubmit={this.handleSubmit.bind(this)}>
            <input
              placeholder="Room Password..."
              value={this.state.password}
              onChange={this.handleChange.bind(this)}
              type="password"
            />
            <Button
              type="submit"
              loading={this.state.waiting}
              onClick={this.handleSubmit}
              className="pt-large pt-intent-primary"
              text="submit">
            </Button>
          </form>
        </div>
      </div>
    );
  }
}

PasswordPrompt.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  roomId: PropTypes.string.isRequired,
  oorjaClient: PropTypes.object.isRequired,
  toaster: PropTypes.object.isRequired,
  roomName: PropTypes.string,
};

export default PasswordPrompt;
