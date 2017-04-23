import React from 'react';

// common proptypes for tab components
export default {
  tabInfo: React.PropTypes.object,
  roomAPI: React.PropTypes.object,
  connectedUsers: React.PropTypes.array,
  roomInfo: React.PropTypes.object,
  classNames: React.PropTypes.string,
  Spinner: React.PropTypes.func,
  style: React.PropTypes.object,
  uiSize: React.PropTypes.string.isRequired,
  onTop: React.PropTypes.bool.isRequired,
};
