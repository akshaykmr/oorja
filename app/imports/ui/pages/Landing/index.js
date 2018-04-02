import React from 'react';
import PropTypes from 'prop-types';
// import scrollToElement from 'scroll-to-element';

import RoomSetup from 'imports/ui/components/RoomSetup';
import MinimalLogo from 'imports/ui/components/MinimalLogo';

const Landing = props =>
  (
    <div className="landing page">
      <div className="navbar">
        <div className="logo">
          <MinimalLogo />
          <div className="oorjaTitle">
            <span className="logo-title">oorja</span>
          </div>
        </div>
        <div className="pill"></div>
      </div>
      <section className="kickstart">
        <h1 className="tagline">
          Connect and collaborate effortlessly and privately
        </h1>
        <div className="minimalDescription">
          with video, voice chat and <strong>much more! </strong>
        </div>
        <RoomSetup history={props.history} />
      </section>
      <section className="about">
          <div className="title">How it works ? 👇</div>
          <div className="step"> Simply create a room and share the link to invite others,
          then you can communicate privately using video/audio and collaborate using
          mini-apps called tabs. </div>

          <div className="step">
            Each tab adds a new capability to the room,
            you can add them to your room whenever needed 🚀
          </div>
          <ul className="previewReel">
            <li>
              <div className="preview"><img src="https://d1laijbq9p776p.cloudfront.net/screenshare.png" alt=""/></div>
              <div className="title">Video chat with screensharing</div>
            </li>
            <li>
              <div className="preview">
                <img className="gif" src="https://d1laijbq9p776p.cloudfront.net/codepad_demo.gif" alt=""/>
              </div>
              <div className="title">Code editor with syntax highligting. synced realtime
              between all participants
              </div>
            </li>
            <li>
              <div className="preview">
                <img className="gif" src="https://d1laijbq9p776p.cloudfront.net/chat_demo.gif" alt=""/>
              </div>
              <div className="title">Chat, simple and private. supports some markdown
                as well
              </div>
            </li>
            <li>
              <div className="preview">
                <img className="gif" src="https://d1laijbq9p776p.cloudfront.net/quill_demo.gif" alt=""/>
              </div>
              <div className="title">Quillpad, a synced rich text editor</div>
            </li>
          </ul>
          <hr/>
          <br/>
          <div id="donate">
            <a className="opensource" href="https://github.com/akshayKMR/oorja" target="_blank" rel="noopener noreferrer">oorja is open source and extensible</a> <i className="ion ion-ios-heart"></i>
            <br/>{`It's a personal project which can be made even better with a few more
            contributors. There are no ads or tracking on this website. I would really appreciate
            donations for continued development and financing server costs of oorja.io`}
            <br/>
            <a className="paypalLink" target="_blank" rel="noopener noreferrer" href="https://paypal.me/akshaykmr" ><span className="donateLink">PayPal</span></a> <br/>
            <span className="bitcoin">
              <a href="bitcoin:1FzAAeMPxdBBhcuXH8XDfXKq5GTcBUncHT" className="bitcoinLink">
                <i style={{ color: '#FF9900' }} className="ion ion-social-bitcoin"></i>
                <span className="donateLink"> Bitcoin: </span>
              </a>
              <span className="bitcoinAddress">
                <code> 1FzAAeMPxdBBhcuXH8XDfXKq5GTcBUncHT </code>
              </span>
            </span>
            <span></span>
            <br/> <br/>
            <a href="https://akshay.oorja.io" target="_blank" rel="noopener noreferrer" id='about'>About me</a>
          </div>
          <br/>
          Got some feedback or something to say?
          <br/>send a
          mail: <a href="mailto:akshay.kmr4321@gmail.com?Subject=Hello%20Akshay">
          akshay.kmr4321@gmail.com </a>
          <br />or find me on twitter <a href="https://twitter.com/uberakshay" target="_blank" rel="noopener noreferrer">@uberakshay</a>

          <br/><br/>
          <br/> <hr/>
          <div className="extraInfo">
            <br/><br/>
            If you experience connectivity issues, well, remember that the app is
            still alpha version. Also, It may be because of firewalls or some
            corporate network configuration.
          </div>
      </section>
      <div className="donateButton">
      <a href="#donate" id="link">Donate <br/> <i className="ion ion-ios-heart"></i> </a>
      </div>
    </div>
  );

Landing.propTypes = {
  history: PropTypes.object.isRequired,
};

export default Landing;
