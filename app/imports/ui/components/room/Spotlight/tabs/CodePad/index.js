import React, { Component } from 'react';

// man monaco editor is awesome imo
// I should replace ace with it. https://microsoft.github.io/monaco-editor/

import * as ace from 'brace';
import 'brace/theme/tomorrow_night_eighties';
import 'brace/theme/dawn';

import 'brace/mode/javascript';
import 'brace/mode/json';
import 'brace/mode/java';
import 'brace/mode/c_cpp';
import 'brace/mode/csharp';
import 'brace/mode/css';
import 'brace/mode/golang';
import 'brace/mode/html';
import 'brace/mode/mysql';
import 'brace/mode/php';
import 'brace/mode/python';
import 'brace/mode/ruby';
import 'brace/mode/swift';
import 'brace/mode/typescript';

import roomActivities from '../../../constants/roomActivities';

import Y from '../../../../../../modules/Yjs';
import tabPropTypes from '../tabPropTypes';

import './codepad.scss';

import Sidebar from '../../../Sidebar/';


class CodePad extends Component {

  constructor(props) {
    super(props);

    this.editor = null; // will be replaced by ace editor instance later
    this.y = null;

    this.colorScheme = [
      {
        name: 'Light',
        theme: 'dawn',
      },
      {
        name: 'Dark',
        theme: 'tomorrow_night_eighties',
      },
    ];

    this.syntaxList = [
      {
        name: 'C C++',
        mode: 'c_cpp',
      },
      {
        name: 'C#',
        mode: 'csharp',
      },
      {
        name: 'CSS',
        mode: 'css',
      },
      {
        name: 'GoLang',
        mode: 'golang',
      },
      {
        name: 'HTML',
        mode: 'html',
      },
      {
        name: 'Java',
        mode: 'java',
      },
      {
        name: 'Javascript',
        mode: 'javascript',
      },
      {
        name: 'JSON',
        mode: 'json',
      },
      {
        name: 'Swift',
        mode: 'swift',
      },
      {
        name: 'TypeScript',
        mode: 'typescript',
      },
    ];

    this.state = {
      activeSyntax: this.syntaxList[6],
      activeColorScheme: this.colorScheme[1],
      initialSyncComplete: false,
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
        room: `${roomInfo.roomName}:${tabInfo.name}`, // clients connecting to the same room share data
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
      editor.getSession().setMode(`ace/mode/${this.state.activeSyntax.mode}`);
      editor.setTheme(`ace/theme/${this.state.activeColorScheme.theme}`);
      y.share.ace.bindAce(editor, { aceRequire: ace.acequire });
      this.editor = editor;

      // add activity listner to focus editor when user switches to this tab.
      roomAPI.addActivityListener(roomActivities.TAB_SWITCH, (payload) => {
        if (payload.to === tabInfo.tabId) {
          editor.focus();
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
    const isSyncing = (!this.state.initialSyncComplete) && (this.props.connectedUsers.length > 1);
    return (
      <div className={this.props.classNames} style={this.props.style}>
        <Sidebar></Sidebar>
        <this.props.Spinner show={this.props.onTop && isSyncing}/>
        <div id="codepad-editor" style={editorStyle}>
        </div>
      </div>
    );
  }
}

CodePad.propTypes = tabPropTypes;

export default CodePad;
