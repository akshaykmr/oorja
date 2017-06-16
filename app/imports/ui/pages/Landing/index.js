import React from 'react';

import RoomSetup from '../../containers/RoomSetup';
import MinimalLogo from '../../components/MinimalLogo';
import './landing.scss';

const Landing = () => (
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
        <b>About:</b> oorja allows you to quickly connect and collaborate with people effortlessly.
        Simply create a room and share the link to invite others,
        then you can communicate peer to peer using video/audio and collaborate using
        mini-apps in the room (called tabs). Each tab adds a new capability to the
        room. Below are some examples of tabs.
        <ul>
          <li>Video chat with screensharing</li>
          <li>Code editor: a text editor that is synced realtime between all participants</li>
          <li>Chat: send chat messages, supports some markdown as well</li>
          <li>Quillpad: a synced rich text editor</li>
          <li>Reactoroids: A game that you can play while you wait for other people to join.</li>
          <li>many more to come</li>
        </ul>

        oorja is built upon some of the latest technologies in modern
        web browsers namely webrtc, (it may not be supported
        in your browser eg. safari, chrome on iOS. It is <b>recommended to use Chrome
        on Desktop</b>)

        <br/><br/>
        The tabs are react components using a simple but powerful mini-api
        (using props and some event listeners) to add more capabilities to the room.
        This is the coolest feature of this project.
        It aids in easily configurable rooms during creation with features relevant to your
        purpose, while also being able to add more later
        (they are loaded dynamically so they won't take much time to load 🚀 ).
        It's exciting to think of the tabs people will develop leveraging the
        super easy p2p interace/api in oorja.
        <br/>
        <br/>
        <b>Note:</b> If you are using chrome you will need to install the
        <a
          target="_blank"
          href="https://chrome.google.com/webstore/detail/oorja-screensharing/kobkjhijljmjkobadoknmhakgfpkhiff?hl=en-US"> screensharing
          extension
        </a> to be able to share your screen.
        <br/><br/>
        If you experience connectivity issues, well, remember that the app is still alpha version.
        Also, It may be because of firewalls or some corporate network configuration.
        <br/><br/>
        <a href="https://github.com/akshayKMR/oorja" target="_blank">oorja is open source ❤️</a>
        <br/> <br/>
        Got some feedback or something to say?
        <br/>
        send a mail:
        <a href="mailto:oorja.akshay@gmail.com?Subject=Hello%20Akshay"> oorja.akshay@gmail.com </a>
         or find me on twitter <a href="https://twitter.com/uberakshay" target="_blank">@uberakshay</a>
        <br/><br/>
        <a href="https://akshay.oorja.io" target="_blank" id='about'>About me</a>
      </div>
    </section>
  </div>
);

export default Landing;
