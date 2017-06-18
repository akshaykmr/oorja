import React from 'react';
// import scrollToElement from 'scroll-to-element';

import RoomSetup from '../../containers/RoomSetup';
import MinimalLogo from '../../components/MinimalLogo';
import './landing.scss';

class Landing extends React.Component {
  render() {
    return (
      <div className="landing page">
        <div className="navbar">
          <div className="logo">
            <MinimalLogo />
            <div className="oorjaTitle">
              <strong>oorja</strong>
            </div>
          </div>
          <div className="pill"></div>
        </div>
        <section className="kickstart">
          <div className="tagline">
            Connect and collaborate quickly and privately
          </div>
          <div className="minimalDescription">
            with video, voice chat and <strong>much more! </strong>
          </div>
          <RoomSetup />
        </section>
        <section className="about">
          <div className="status-text">
            <h2>About 👇</h2>
            With oorja you can quickly connect and collaborate with people
            effortlessly and privately.
            Simply create a room and share the link to invite others,
            then you can communicate peer to peer using video/audio and collaborate using
            mini-apps in the room (called tabs). Each tab adds a new capability to the
            room, you can add them to your room whenever needed. <br/>
            Below are some examples of tabs.
            <ul>
              <li>
                <div className="preview"><img src="https://imgur.com/oYNdefL.png" alt=""/></div>
                <div className="title">Video chat with screensharing</div>
              </li>
              <li>
                <div className="preview">
                  <img className="gif" src="https://imgur.com/Mh5Kyl1.gif" alt=""/>
                </div>
                <div className="title">Code editor with syntax highligting. synced realtime
                between all participants
                </div>
              </li>
              <li>
                <div className="preview">
                  <img className="gif" src="https://imgur.com/AVSXJ3s.gif" alt=""/>
                </div>
                <div className="title">Chat, simple and private. supports some markdown
                  as well
                </div>
              </li>
              <li>
                <div className="preview">
                  <img className="gif" src="https://imgur.com/ouc1Y37.gif" alt=""/>
                </div>
                <div className="title">Quillpad, a synced rich text editor</div>
              </li>
            </ul>
            <hr/>
            <br/>
            <div id="donate">
              <a className="opensource" href="https://github.com/akshayKMR/oorja" target="_blank">oorja is open source and extendible</a> ❤️
              <br/> It's a personal project which can be made even better with a few more
              contributors. There are no ads or tracking on this website. I would really appreciate
              donations for continued development and financing server costs of oorja.io
              <br/>
              <a target="_blank" href="https://patreon.com/oorja" className="patreonButton">
                <img src="https://imgur.com/pGpBRtO.png" alt="patreon - oorja"/>
              </a> <br/>
              <span className="bitcoin">
                <a href="bitcoin:1FzAAeMPxdBBhcuXH8XDfXKq5GTcBUncHT" className="bitcoinLink">
                  <i style={{ color: '#FF9900' }} className="ion ion-social-bitcoin"></i>
                  <b> Bitcoin: </b>
                </a>
                <span className="bitcoinAddress">
                  <code> 1FzAAeMPxdBBhcuXH8XDfXKq5GTcBUncHT </code>
                </span>
              </span>
              <span></span>
              <br/> <br/>
              <a href="https://akshay.oorja.io" target="_blank" id='about'>About me</a>
            </div>
            <br/>
            Got some feedback or something to say?
            <br/>send a
            mail: <a href="mailto:oorja.akshay@gmail.com?Subject=Hello%20Akshay">
            oorja.akshay@gmail.com </a>
            or find me on twitter <a href="https://twitter.com/uberakshay" target="_blank">@uberakshay</a>

            <br/><br/>
            <br/> <hr/>
            <div className="extraInfo">
              oorja is built upon some of the latest technologies in modern
              web browsers namely webrtc, (it may not be supported
              in your browser eg. safari, chrome on iOS. It is <b>recommended to use Chrome
              on Desktop</b>)
              <br/>
              <br/>
              <b>Note:</b> If you are using chrome you will need to install the
              <a
                target="_blank"
                href="https://chrome.google.com/webstore/detail/oorja-screensharing/kobkjhijljmjkobadoknmhakgfpkhiff?hl=en-US"> screensharing
                extension
              </a> to be able to share your screen.
              <br/><br/>
              If you experience connectivity issues, well, remember that the app is
              still alpha version. Also, It may be because of firewalls or some
              corporate network configuration.
            </div>
          </div>
        </section>
        <div className="donateButton">
        <a href="#donate" id="link">Donate <br/> ❤️ </a>
        </div>
      </div>
    );
  }
}

export default Landing;
