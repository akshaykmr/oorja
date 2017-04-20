import React, { Component } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import classNames from 'classnames';
import { Button } from '@blueprintjs/core';
// import ImageLoader from 'react-imageloader';


import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import LoginWithService from '../../components/LoginWithService/';
import { joinRoom } from '../../actions/roomConfiguration';

import Avatar from '../../components/room/Avatar';


import './JoinRoomForm.scss';

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
    this.enableAnon = this.enableAnon.bind(this);
    this.state = this.initialState();
    this.existingUser = _.find(this.props.roomInfo.participants, { userId: this.props.roomUserId });
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
        goAnon: false,
      };
    }
    return {
      waiting: false,
      loggedIn: !!user,
      name: user ? `${user.profile.firstName} ${user.profile.lastName}` : '',
      textAvatarColor: this.getRandomColor(),
      picture: user ? user.profile.picture : null,
      goAnon: false,
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
    this.props.joinRoom(this.props.roomInfo._id, name, textAvatarColor).then(
      () => {
        this.setState({
          ...this.state,
          waiting: false,
        });
        this.props.processComplete();
      },
    );
  }

  enableAnon() {
    if (this.state.goAnon) return;
    this.setState({
      ...this.state,
      goAnon: true,
    });
  }

  render() {
    const { name, loggedIn, picture, waiting, textAvatarColor, existingUser, goAnon } = this.state;
    const inputAttr = {
      disabled: loggedIn || !!this.existingUser,
      value: name,
      onChange: this.handleNameChange,
      className: `nameInput ${name ? 'active' : ''}`,
      placeholder: 'Your Name...',
    };

    const renderAvatar = () => {
      const avatarStyle = {
        opacity: (!picture && !name) ? 0 : 100,
      };

      return (
        <Avatar
          name={name}
          picture={picture}
          textAvatarColor={textAvatarColor}
          avatarStyle={avatarStyle}
        />
      );
    };

    const buttonAttr = {
      type: 'submit',
      text: 'Join the Room',
      rightIconName: 'arrow-right',
      disabled: !name || waiting,
      loading: waiting,
      className: 'joinButton pt-large pt-intent-success',
      onSubmit: this.handleSubmit,
      onClick: this.handleSubmit,
    };

    const loginContainerClasses = classNames({
      blur: !loggedIn && name,
      hidden: this.existingUser,
    });

    const renderPreview = () => {
      if (loggedIn || existingUser || goAnon) {
        return (
          <div className="interactiveInput">
            {renderAvatar()}
            <input type="text" {...inputAttr}/>
          </div>
        );
      }
      return (
        <div className="goAnonText">
          <span className="animate fade-in" onClick={this.enableAnon}>join anonymously?</span>
        </div>
      );
    };
    return (
      <div className='JoinRoomForm'>
      <form onSubmit={this.handleSubmit}>
        <LoginWithService
          extraClasses={loginContainerClasses} />
        {renderPreview()}
        <div className="joinButtonWrapper">
          <Button {...buttonAttr} />
        </div>
      </form>
      </div>
    );
  }
}

JoinRoomForm.propTypes = {
  processComplete: React.PropTypes.func.isRequired,
  joinRoom: React.PropTypes.func.isRequired,
  roomInfo: React.PropTypes.object.isRequired,
  roomUserId: React.PropTypes.string,
};


export default connect(null, { joinRoom })(JoinRoomForm);
