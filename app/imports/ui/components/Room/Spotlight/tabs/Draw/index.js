/* global window */

import React, { Component } from 'react';

import Y from 'imports/modules/Yjs';
import roomActivities from 'imports/ui/components/Room/constants/roomActivities';
import * as d3 from 'd3';
import update from 'immutability-helper';
import { Button } from '@blueprintjs/core';
import { Trash } from 'imports/ui/components/icons';
import Spinner from '../../Spinner';
import tabPropTypes from '../tabPropTypes';
import './draw.scss';

class Draw extends Component {
  constructor(props) {
    super(props);
    this.y = null;
    this.svg = null;

    this.state = {
      initialSyncComplete: false,
    };
    this.clearBoard = this.clearBoard.bind(this);
    this.stateBuffer = this.state;
  }

  updateState(changes, buffer = this.stateBuffer) {
    this.stateBuffer = update(buffer, changes);
    this.setState(this.stateBuffer);
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
        name: 'oorjaConnector',
        room: `${roomInfo.roomName}:${tabInfo.name}`,
        role: 'slave',
        syncMethod: 'syncAll',
        roomAPI,
        connectedUsers,
        tabInfo,
        roomInfo,
      },
      share: {
        drawing: 'Array',
      },
    }).then((y) => {
      this.y = y;
      const { drawing } = y.share;

      let sharedLine = null;
      function dragstart() {
        drawing.insert(drawing.length, [Y.Array]);
        sharedLine = drawing.get(drawing.length - 1);
      }

      // After one dragged event is recognized, we ignore them for 33ms.
      let ignoreDrag = null;
      function drag() {
        if (sharedLine != null && ignoreDrag == null) {
          ignoreDrag = window.setTimeout(() => {
            ignoreDrag = null;
          }, 33);
          sharedLine.push([d3.mouse(this)]);
        }
      }

      function dragend() {
        sharedLine = null;
        window.clearTimeout(ignoreDrag);
        ignoreDrag = null;
      }

      this.svg = d3.select('#drawingCanvas')
        .call(d3.behavior.drag()
          .on('dragstart', dragstart)
          .on('drag', drag)
          .on('dragend', dragend));

      const renderPath = d3.svg.line()
        .x(d => d[0])
        .y(d => d[1])
        .interpolate('basis');

      // create line from a shared array object and update the line when the array changes
      const drawLine = (yarray) => {
        const line = this.svg.append('path').datum(yarray.toArray());
        line.attr('d', renderPath);
        yarray.observe((event) => {
          // we only implement insert events that are appended to the end of the array
          event.values.forEach((value) => {
            line.datum().push(value);
          });
          line.attr('d', renderPath);
        });
      };

      // call drawLine every time an array is appended
      y.share.drawing.observe((event) => {
        if (event.type === 'insert') {
          event.values.forEach(drawLine);
        } else {
          // just remove all elements (thats what we do anyway)
          this.svg.selectAll('path').remove();
        }
      });

      // draw all existing content
      for (let i = 0; i < drawing.length; i++) {
        drawLine(drawing.get(i));
      }

      y.connector.whenSynced(() => {
        this.updateState({ initialSyncComplete: { $set: true } });
        console.info(tabInfo.name, 'synced');
      });

      roomAPI.addActivityListener(roomActivities.TAB_SWITCH, (payload) => {
        if (payload.to === tabInfo.tabId) {
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
      setTabReady();
    });
  }

  componentWillUnmount() {
    this.y.close();
  }

  clearBoard() {
    if (!this.y) return;
    const { drawing } = this.y.share;
    drawing.delete(0, drawing.length);
  }

  render() {
    const buttonAttr = {
      className: 'pt-intent-primary',
      onClick: this.clearBoard,
    };
    const isSyncing = (!this.state.initialSyncComplete) && (this.props.connectedUsers.length > 1);
    return (
      <div className={this.props.classNames} style={this.props.style}>
      <div className="clearButtonContainer">
        <Button {...buttonAttr}>
          <span className="clearButtonContent"> Clear board </span> <Trash/>
        </Button>
      </div>
        <svg id="drawingCanvas"></svg>
        <Spinner show={this.props.onTop && isSyncing}/>
      </div>
    );
  }
}

Draw.propTypes = tabPropTypes;

export default Draw;
