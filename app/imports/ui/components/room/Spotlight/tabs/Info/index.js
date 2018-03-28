/* global window */

import React, { Component } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { Intent } from '@blueprintjs/core';

import { Copy } from 'imports/ui/components/icons';

import uiConfig from '../../../constants/uiConfig';

import SupremeToaster from '../../../../../components/Toaster';
import Arrow from '../../../../arrow';

import tabPropTypes from '../tabPropTypes';
import './info.scss';

import roomActivities from '../../../constants/roomActivities';

class Info extends Component {
  constructor(props) {
    super(props);
    this.onCopy = this.onCopy.bind(this);
    const roomLink = window.location.href;
    this.state = {
      roomLink,
      copied: false,
    };
  }

  onCopy() {
    this.setState({ copied: true });
    SupremeToaster.show({
      message: (
        <div>Link Copied to Clipboard 👍 <br/> Share it to invite others to this room </div>
      ),
      intent: Intent.SUCCESS,
    });
  }

  componentDidMount() {
    this.props.roomAPI.addActivityListener(roomActivities.USER_JOINED, () => {
      if (this.props.onTop && this.props.connectedUsers.length === 2) {
        // switch to video chat tab (UX, most people are going to invite one person)
        // however, switching to any tab will not take place if the tab isn't loaded in the room
        this.props.switchToTab(10);
      }
    });
  }

  render() {
    const { roomLink } = this.state;
    return (
      <div className={this.props.classNames} style={this.props.style}>
        <CopyToClipboard text={roomLink}
          onCopy={this.onCopy}>
          <div className="shareRoom" onClick={this.copyRoomLinkToClipboard}>
            <div className="copyButton">
              <Copy />
            </div>
            <div className="copyText">
              Click to copy room link <span className='hand'>👋</span>
            </div>
            <div className="roomLink">
                <a onClick={ event => event.preventDefault()}
                  href={roomLink}>{roomLink}
                </a>
            </div>
            <div className="copyReason">
              Share it to invite others to this room
            </div>
          </div>
        </CopyToClipboard>

        <div className="exploreContainer" style={{ opacity: this.props.roomReady ? 1 : 0 }}>
          <div className="arrowPointer">
            <Arrow />
          </div>
          <div className="text">
            {
              this.props.uiSize === uiConfig.COMPACT ?
                (<div> Explore <i className="icon ion-arrow-down-c"></i></div>)
                : 'Explore, hover over a tab to know more'
            }
          </div>
        </div>
      </div>
    );
  }
}

Info.propTypes = tabPropTypes;

export default Info;
