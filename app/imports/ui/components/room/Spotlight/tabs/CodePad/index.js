import React, { Component } from 'react';
import update from 'immutability-helper';
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

import syntaxList from './syntaxList';
import colorSchemes from './colorSchemes';

import roomActivities from '../../../constants/roomActivities';

import Y from '../../../../../../modules/Yjs';
import tabPropTypes from '../tabPropTypes';

import './codepad.scss';

import Sidebar from '../../../Sidebar/';
import SettingsTab from './SettingsTab';

class CodePad extends Component {

  constructor(props) {
    super(props);

    this.editor = null; // will be replaced by ace editor instance later
    this.y = null;

    this.defaults = {
      fontSize: 15,
      syntax: syntaxList[6], // default | javascript
      colorScheme: colorSchemes[1], // default | dark,
    };

    // todo save any editor settings in localStorage and
    // override defaults over here.

    this.state = {

      initialSyncComplete: false,
      tabList: [
        {
          name: 'editorSettings',
          component: SettingsTab,
          componentProps: {
            editor: this.editor,
            initialSettings: this.defaults,
          },
          bgColor: '#2e3136',
          iconColor: '#45b29d',
          icon: 'ion-ios-settings',
        },
      ],
    };
    this.stateBuffer = this.state;
  }

  updateState(changes, buffer = this.stateBuffer) {
    this.stateBuffer = update(buffer, changes);
    this.setState(this.stateBuffer);
  }

  updateEditorSettings(changes, buffer = this.stateBuffer.tabList[0]) {
    const updatedEditorSettings = update(buffer, changes);
    this.updateState({
      tabList: { $splice: [[0, 1, updatedEditorSettings]] },
    });
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
      editor.getSession().setMode(`ace/mode/${this.defaults.syntax.mode}`);
      editor.setTheme(`ace/theme/${this.defaults.colorScheme.theme}`);
      y.share.ace.bindAce(editor, { aceRequire: ace.acequire });
      this.editor = editor;
      this.updateEditorSettings({
        componentProps: {
          editor: { $set: editor },
        },
      });

      // add activity listner to focus editor when user switches to this tab.
      roomAPI.addActivityListener(roomActivities.TAB_SWITCH, (payload) => {
        if (payload.to === tabInfo.tabId) {
          editor.focus();
        }
      });

      y.connector.whenSynced(() => {
        this.updateState({
          // synced with atleast one user. not called when no other user in the room.
          initialSyncComplete: { $set: true },
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

      fontSize: this.defaults.fontSize,
    };
    const isSyncing = (!this.state.initialSyncComplete) && (this.props.connectedUsers.length > 1);
    return (
      <div className={this.props.classNames} style={this.props.style}>
        <Sidebar tabList={this.state.tabList}></Sidebar>
        <this.props.Spinner show={this.props.onTop && isSyncing}/>
        <div id="codepad-editor" style={editorStyle}>
        </div>
      </div>
    );
  }
}

CodePad.propTypes = tabPropTypes;

export default CodePad;
