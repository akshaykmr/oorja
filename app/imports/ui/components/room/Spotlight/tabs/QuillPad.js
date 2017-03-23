import React, { Component } from 'react';
import 'quill/dist/quill.snow.css';
import Quill from 'quill';

import Y from '../../../../../modules/Yjs';
import tabPropTypes from './tabPropTypes';

class QuillPad extends Component {

  constructor(props) {
    super(props);
    this.state = {
      synced: false,
    };
  }
  componentDidMount() {
    const { roomAPI, connectedUsers, tabInfo, roomInfo } = this.props;
    new Y({
      db: {
        name: 'indexeddb',
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
        richtext: 'Richtext',
      },
    }).then((y) => {
      this.y = y;

      this.quill = new Quill('#editor', {
        theme: 'snow',
        bounds: tabInfo.name,
        modules: {
          // formula: true, KaTex
          syntax: true, // uses highliht js
          toolbar: [
            [{ size: ['small', false, 'large', 'huge'] }],
            ['bold', 'italic', 'underline'],
            [{ color: [] }, { background: [] }],    // Snow theme fills in values
            [{ script: 'sub' }, { script: 'super' }],
            ['link', 'image'],
            ['link', 'code-block'],
            [{ list: 'ordered' }],
          ],
        },
      });
      y.share.richtext.bind(this.quill);

      y.connector.whenSynced(() => {
        this.setState({
          ...this.state,
          synced: true, // synced with atleast one user. not called when no other user in the room.
        });
        console.info(tabInfo.name, 'synced');
      });
    });
  }

  componentWillUnmount() {
    this.y.close();
  }

  render() {
    return (
      <div className={this.props.classNames} style={this.props.style}>
        <div id="editor" style={{ height: 'calc(100% - 42px)' }}>
        </div>
      </div>
    );
  }
}

QuillPad.propTypes = tabPropTypes;

export default QuillPad;
