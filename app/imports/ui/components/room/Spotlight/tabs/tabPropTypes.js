import React from 'react';
import PropTypes from 'prop-types';

// common proptypes for tab components
export default {
  tabInfo: PropTypes.object.isRequired,
  tabStatusRegistry: PropTypes.object.isRequired,
  updateBadge: PropTypes.func.isRequired,
  switchToTab: PropTypes.func.isRequired,
  addTabToRoom: PropTypes.func.isRequired,
  roomAPI: PropTypes.object.isRequired,
  setTabReady: PropTypes.func.isRequired,
  connectedUsers: PropTypes.array.isRequired,
  roomInfo: PropTypes.object.isRequired,
  roomReady: PropTypes.bool.isRequired,
  classNames: PropTypes.string,
  style: PropTypes.object,
  uiSize: PropTypes.string.isRequired,
  onTop: PropTypes.bool.isRequired,
  primaryMediaStreamState: PropTypes.object.isRequired,
  screenSharingStreamState: PropTypes.object.isRequired,
  touchDevice: PropTypes.bool.isRequired,
};
