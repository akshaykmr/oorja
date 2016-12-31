import React, { Component } from 'react';
import { connect } from 'react-redux';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import ImageLoader from 'react-imageloader';

import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

// inputs user name and joins the room.
class JoinRoomForm extends Component {

  constructor(props) {
    super(props);
    this.state = this.initialState();

    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  initialState(user = Meteor.user()) {
    // if user is already logged in I can get their profile info
    // on the server. no need to get them here.
    // just need their name if logged out.
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

  handleSubmit(event) {
    event.preventDefault();
  }

  render() {
    const { name, loggedIn, picture } = this.state;
    const attr = {
      disabled: loggedIn,
      value: name,
      onChange: this.handleNameChange,
    };

    const textAvatar = () => {
      if (!name || picture) return null;
      // first two letters of the name or first letters of first and last word.
      const words = name.toUpperCase().trim().split(' ');
      let initials = '';
      if (words.length > 1) {
        initials = words[0][0] + words[words.length - 1][0];
      } else if (words.length === 1 && words[0] !== '') {
        initials = words[0][0];
        if (words[0][1]) initials += words[0][1];
      }
      return (
        <div className='textAvatar'>
          {initials}
        </div>
      );
    };

    const avatar = picture ? <img className="avatar" src={picture} alt=""/> : null;

    const buttonAttr = {
      disabled: !name,
      className: 'joinButton',
    };

    return (
      <div className='JoinRoomForm'>
      <form onSubmit={this.handleSubmit}>
          <ReactCSSTransitionGroup
            transitionName="avatar"
            transitionAppear={true}
            transitionAppearTimeout={2000}
            transitionEnterTimeout={2000}
            transitionLeaveTimeout={300}>
            {avatar}
          </ReactCSSTransitionGroup>
          <ReactCSSTransitionGroup
            transitionName="textAvatar"
            transitionEnterTimeout={300}
            transitionLeaveTimeout={100}>
            {textAvatar()}
          </ReactCSSTransitionGroup>
        <div className='nameInput'> <input type="text" {...attr}/> </div>
        <button {...buttonAttr} type="submit">Join the Room !</button>
      </form>
      </div>
    );
  }
}

export default connect(null, null)(JoinRoomForm);
