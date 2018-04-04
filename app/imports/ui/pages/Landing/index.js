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
          <div className="header">How it works ? 👇</div>
          <div className="step"> Simply create a room and share the link to invite others,
          then you can communicate privately using video/audio and collaborate using
          mini-apps called tabs. </div>

          <ul className="previewReel">
            <li>
              <div className="preview"><img src="https://d1laijbq9p776p.cloudfront.net/screenshare2.png" alt=""/></div>
              <div className="title">Share your screen.</div>
            </li>
          </ul>

          <div className="step">
            Each tab adds a new capability to the room,
            you can add them to your room whenever needed 🚀
          </div>
          <ul className="previewReel">
            <li>
              <div className="preview">
                <img className="gif" src="https://d1laijbq9p776p.cloudfront.net/codepad_demo2.gif" alt=""/>
              </div>
              <div className="title">Code editor for quick snippets. Synced realtime
              between all participants
              </div>
            </li>
            <li>
              <div className="preview">
                <img className="gif" src="https://d1laijbq9p776p.cloudfront.net/chat_demo2.gif" alt=""/>
              </div>
              <div className="title">Chat, simple and private. Supports some markdown
                as well
              </div>
            </li>
            <li>
              <div className="preview">
                <img className="gif" src="https://d1laijbq9p776p.cloudfront.net/quill_demo2.gif" alt=""/>
              </div>
              <div className="title">Quillpad, a rich text editor.</div>
            </li>
          </ul>

          <hr/>
          <i>
          In oorja, all video and voice comms are encrypted.
          None of the data in your tabs is stored on the server; it
          gets synced from one participants browser to another</i> 🔮<i>.
          There are no ads or tracking on this website.
          </i>
          <hr/>

          <br/>
          Got some feedback or something to say?
          <br/>send a
          mail: <a href="mailto:akshay.kmr4321@gmail.com?Subject=Hello%20Akshay">
          akshay.kmr4321@gmail.com </a>
          <br />or find me on twitter <a href="https://twitter.com/uberakshay" target="_blank" rel="noopener noreferrer">@uberakshay</a>

          <br/>
          <hr/>
          <br/>
          <div className="extraInfo">
            oorja.io uses peer to peer connections for media, this is suitable
            for rooms with upto 4 participants. To support more you can deploy your
            own oorja instance with a media server to do the heavy lifting 💪.
            <br/><br/>
            If you experience connectivity issues, well, remember that the app is
            still alpha version. Also, It may be because of firewalls or some
            corporate network configuration.
          </div>
      </section>

    </div>
  );

Landing.propTypes = {
  history: PropTypes.object.isRequired,
};

export default Landing;
