import React, { Component } from 'react';

import Y from '../../../../../modules/Yjs';
import tabPropTypes from './tabPropTypes';

class ExperimentTab extends Component {

  componentDidMount() {
    const { roomAPI, connectedUsers, tabInfo, roomInfo } = this.props;
    new Y({
      db: {
        name: 'indexeddb', // use memory database adapter.
        // name: 'indexeddb' // use indexeddb database adapter instead for offline apps
      },
      connector: {
        name: 'licodeConnector', // use webrtc connector
        room: this.props.roomInfo.roomName, // clients connecting to the same room share data
        role: 'slave',
        syncMethod: 'syncAll',
        roomAPI,
        connectedUsers,
        tabInfo,
        roomInfo,
      },
      share: {
        textarea: 'Text', // y.share.textarea is of type y-text
      },
    }).then((yinst) => {
      console.log(yinst);
      yinst.share.textarea.bind(document.querySelector('textarea'));
    });
  }
  render() {
    return (
      <div className={this.props.classNames} style={this.props.style}>
      <textarea></textarea>
      </div>
    );
  }
}

ExperimentTab.propTypes = tabPropTypes;

export default ExperimentTab;
