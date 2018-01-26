import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { extractInitialsFromName } from 'imports/modules/user/utilities';

import './avatar.scss';

class Avatar extends Component {
// TODO: fix images for fb, twitter. google image works occasionally?
  constructor(props) {
    super(props);
    this.imageCurtainColor = 'floralwhite'; // bg color when Avatarimage is loading. should not be bright imo.
    this.loadImg = this.loadImg.bind(this);

    const { user, picture } = props;

    this.state = {
      loadComplete: false,
      pictureError: false,
      pictureSrc: (user && user.picture) || picture,
    };
  }

  loadImg(options, callback) {
    let seconds = 0;
    const maxSeconds = 10;
    let complete = false;
    let done = false;

    const img = new Image();
    const tryImage = () => {
      if (done) {
        return;
      }
      if (seconds >= maxSeconds) {
        callback({
          err: 'timeout',
        });
        done = true;
        return;
      }
      if (complete && img.complete) {
        if (img.width && img.height) {
          callback({
            img,
          });
          done = true;
          return;
        }
        callback({
          err: '404',
        });
        done = true;
        return;
      } else if (img.complete) {
        complete = true;
      }
      seconds++;
      /* eslint-disable no-param-reassign */
      callback.tryImage = setTimeout(tryImage, 1000);
      /* eslint-enable no-param-reassign */
    };

    img.onload = tryImage();
    img.onerror = (error) => {
      done = true;
      console.error(error);
      this.setState({
        ...this.state,
        loadComplete: true,
        pictureError: true,
      });
    };
    img.src = options.src;
    tryImage();
  }

  handleImageState(pictureSrc = this.state.pictureSrc) {
    if (!pictureSrc) return;
    this.loadImg({ src: pictureSrc }, (status) => {
      if (!status.err) {
        this.setState({
          ...this.state,
          pictureSrc,
          pictureError: false,
          loadComplete: true,
        });
      } else {
        this.setState({
          ...this.state,
          loadComplete: true,
          pictureError: true,
        });
      }
    });
  }
  componentWillMount() {
    this.handleImageState();
  }
  componentWillReceiveProps(nextProps) {
    const { user, picture } = nextProps;
    const newPictureSrc = (user && user.picture) || picture;
    if (newPictureSrc !== this.state.pictureSrc) {
      this.setState({
        pictureError: false,
        loadComplete: false,
        pictureSrc: newPictureSrc,
      });
      this.handleImageState(newPictureSrc);
    }
  }

  render() {
    // pararms to be picked from user object if in props, else explicitly specified.
    const paramContainer = this.props.user ? this.props.user : this.props;
    const { pictureError, loadComplete, pictureSrc } = this.state;
    const {
      name, initials, textAvatarColor, avatarStyle,
    } = paramContainer;
    const text = initials || extractInitialsFromName(name);
    const defaultStyle = {
      backgroundImage: pictureSrc && loadComplete && !pictureError ? `url(${pictureSrc})` : null,
      backgroundColor: textAvatarColor,
    };
    // supported sizes 30px, 50px default, 80px
    const size = this.props.size || '50px';
    let fontSize = '';
    switch (size) { // I want it to look perfect....
      case '30px': fontSize = '0.7em';
        break;
      case '80px': fontSize = '1.7em';
        break;
      default: fontSize = '1.0em';
    }
    const sizeStyle = {
      height: size,
      width: size,
      lineHeight: size,
      fontSize,
    };

    return (
      <div className="avatar" style={Object.assign(defaultStyle, avatarStyle, sizeStyle)}
        onClick={this.props.onClick}>
        {!pictureSrc || pictureError || !loadComplete ? text : ''}
      </div>
    );
  }
}

Avatar.propTypes = {
  size: PropTypes.string, // 30px, 50px, 80px
  user: PropTypes.object, // if user is passed as prop, pull the properties below from it.
  name: PropTypes.string,
  initials: PropTypes.string,
  textAvatarColor: PropTypes.string,
  picture: PropTypes.string,
  avatarStyle: PropTypes.object,
  onClick: PropTypes.func,
};


export default Avatar;
