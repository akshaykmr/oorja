import React, { Component } from 'react';
import 'quill/dist/quill.snow.css';
import Quill from 'quill';
// import { ImageResize } from 'quill-image-resize-module';
// import { ImageDrop } from 'quill-image-drop-module';

// npm
// "quill-image-drop-module": "^1.0.3",
// "quill-image-resize-module": "^3.0.0",

import Y from 'imports/modules/Yjs';
import tabPropTypes from '../tabPropTypes';

import roomActivities from '../../../constants/roomActivities';

import './quillpad.scss';

import Spinner from '../../Spinner';

// Quill.register('modules/imageResize', ImageResize);
// Quill.register('modules/imageDrop', ImageDrop);

class QuillPad extends Component {
  constructor(props) {
    super(props);
    this.quill = null; // will be replace by quill instance later.
    this.y = null;
    this.state = {
      initialSyncComplete: false,
    };
  }
  componentDidMount() {
    const {
      roomAPI, connectedUsers, tabInfo, roomInfo, setTabReady,
    } = this.props;
    new Y({
      db: {
        name: 'indexeddb',
      },
      connector: {
        name: 'oorjaConnector', // use webrtc connector
        room: `${roomInfo.roomName}:${tabInfo.name}`, // clients connecting to the same room share data
        role: 'slave',
        syncMethod: 'syncAll',
        roomAPI,
        connectedUsers,
        tabInfo,
        roomInfo,
      },
      share: {
        richtext: 'Richtext',
      },
    }).then((y) => {
      this.y = y;

      this.quill = new Quill('#quillpad-editor', {
        theme: 'snow',
        bounds: tabInfo.name,
        modules: {
          // formula: true, KaTex
          // syntax: true, // uses highlight js
          toolbar: [
            [{ size: ['small', false, 'large', 'huge'] }],
            ['bold', 'italic', 'underline'],
            [{ color: [] }, { background: [] }], // Snow theme fills in values
            [{ script: 'sub' }, { script: 'super' }],
            ['link', 'image'],
            ['link', 'code-block'],
            [{ list: 'ordered' }],
          ],
          history: {
            delay: 1000,
            maxStack: 50,
            userOnly: true,
          },
          // imageDrop: true,
          // ImageResize: {},
        },
      });
      y.share.richtext.bind(this.quill);

      roomAPI.addActivityListener(roomActivities.TAB_SWITCH, (payload) => {
        if (payload.to === tabInfo.tabId) {
          if (!this.props.touchDevice) this.quill.focus();
          if (this.props.tabInfo.badge.visible) {
            this.props.updateBadge({
              visible: false,
            });
          }
        }
      });

      roomAPI.addMessageHandler(tabInfo.tabId, () => {
        if (!this.props.onTop) {
          this.props.updateBadge({
            visible: true,
          });
        }
      });

      y.connector.whenSynced(() => {
        this.setState({
          ...this.state,

          // synced with atleast one user. not called when no other user in the room.
          initialSyncComplete: true,
        });
        console.info(tabInfo.name, 'synced');
      });
      setTabReady();
    });
  }

  componentWillUnmount() {
    this.y.close();
  }

  render() {
    const isSyncing = (!this.state.initialSyncComplete) && (this.props.connectedUsers.length > 1);
    return (
      <div className={this.props.classNames} style={this.props.style}>
        <Spinner show={this.props.onTop && isSyncing }/>
        <div id="quillpad-editor" style={{ height: 'calc(100% - 68px)' }}>
        </div>
      </div>
    );
  }
}

QuillPad.propTypes = tabPropTypes;

export default QuillPad;
