import React, { Component } from 'react';

import * as ace from 'brace';
import 'brace/mode/javascript';
import 'brace/theme/dawn';

import Y from '../../../../../../modules/Yjs';
import tabPropTypes from '../tabPropTypes';

class CodePad extends Component {

  constructor(props) {
    super(props);

    this.editor = null; // will be replaced by ace editor instance later
    this.y = null;

    this.state = {
      synced: false,
      fontSize: 16,
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
        ace: 'Text',
      },
    }).then((y) => {
      this.y = y;

      const editor = ace.edit('codepad-editor');
      editor.getSession().setMode('ace/mode/javascript');
      editor.setTheme('ace/theme/dawn');
      y.share.ace.bindAce(editor, { aceRequire: ace.acequire });
      this.editor = editor;

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
    this.editor.destroy();
    this.editor.container.remove();
  }

  render() {
    const editorStyle = {
      height: '100%',
      width: '100%',
      position: 'relative',

      fontSize: this.state.fontSize,
    };
    return (
      <div className={this.props.classNames} style={this.props.style}>
        <div id="codepad-editor" style={editorStyle}>
        </div>
      </div>
    );
  }
}

CodePad.propTypes = tabPropTypes;

export default CodePad;
