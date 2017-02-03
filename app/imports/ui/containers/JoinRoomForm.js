import React, { Component } from 'react';
import { connect } from 'react-redux';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import _ from 'lodash';
// import ImageLoader from 'react-imageloader';

import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import LoginWithService from '../components/LoginWithService';
import { joinRoom } from '../actions/roomConfiguration';

import { Rooms as MongoRoom } from '../../collections/common';

// inputs user name and joins the room.
class JoinRoomForm extends Component {

  constructor(props) {
    super(props);

    // a set of colors used to style avatar.
    this.colors = ['#c78ae1', '#f4d448', '#66aee3', '#ffaf51', '#7bcd52', '#23bfb0',
      '#e5176f', '#d784a6'];

    this.initialState = this.initialState.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.room = MongoRoom.findOne();
    this.state = this.initialState();
    this.existingUser = _.find(this.room.participants, { userId: this.props.roomUserId });
  }

  getRandomColor() {
    return this.colors[Math.floor(Math.random() * this.colors.length)];
  }

  initialState() {
    // if user is already logged in I can get their profile info
    // on the server. no need to get them here.
    // just need their name if logged out.
    const user = Meteor.user();
    if (this.existingUser) {
      const { firstName, picture, textAvatarColor } = this.existingUser;
      return {
        waiting: false,
        loggedIn: !!user,
        name: firstName,
        textAvatarColor: textAvatarColor || this.getRandomColor(),
        picture,
      };
    }
    return {
      waiting: false,
      loggedIn: !!user,
      name: user ? `${user.profile.firstName} ${user.profile.lastName}` : '',
      textAvatarColor: this.getRandomColor(),
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
      ...this.state,
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
      textAvatarColor: this.getRandomColor(),
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    if (this.state.waiting) return;
    if (!Meteor.user() && !this.state.name) {
      return;
    }

    const { name, textAvatarColor } = this.state;
    this.setState({
      ...this.state,
      waiting: true,
    });
    this.props.joinRoom(name, textAvatarColor).then(
      () => {
        this.setState({
          ...this.state,
          waiting: false,
        });
        this.props.processComplete();
      },
    );
  }

  render() {
    const { name, loggedIn, picture, waiting } = this.state;
    const inputAttr = {
      disabled: loggedIn || !!this.existingUser,
      value: name,
      onChange: this.handleNameChange,
      className: `nameInput ${name ? 'active' : ''}`,
      placeholder: 'Your Name...',
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
        <div className='textAvatar'
        style={{ backgroundColor: this.state.textAvatarColor }}>
          {initials}
        </div>
      );
    };

    const avatar = picture ? <img className="avatar" src={picture} alt=""/> : null;

    const buttonAttr = {
      disabled: !name || waiting,
      className: 'joinButton',
      onSubmit: this.handleSubmit,
    };

    const loginContainerClasses = () => {
      let classes = '';
      if (!loggedIn && name) classes += ' blur';
      if (this.existingUser) classes += ' hidden';
      return classes;
    };
    return (
      <div className='JoinRoomForm'>
      <form onSubmit={this.handleSubmit}>
        <div className="interactiveInput">
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

          <input type="text" {...inputAttr}/>
        </div>

        <LoginWithService
          extraClasses={loginContainerClasses()} />
        <div className="joinButtonWrapper">
          <button {...buttonAttr} type="submit">Join the Room !</button>
        </div>
      </form>
      </div>
    );
  }
}

JoinRoomForm.propTypes = {
  processComplete: React.PropTypes.func.isRequired,
  joinRoom: React.PropTypes.func.isRequired,
  roomUserId: React.PropTypes.string,
};


export default connect(null, { joinRoom })(JoinRoomForm);
