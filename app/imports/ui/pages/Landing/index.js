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
        This project is currently in development mode, and hosted here for
        testing purposes. If you are here please feel free to give it a spin
        but don't use for anything serious. I repeat this is an alpha version with
        a long way to go..
        <br/>
        <br/>
        <b>About:</b> oorja is built upon some of the latest technologies in modern
        web browsers namely webrtc that enables p2p communication. (it may not be supported
        in your browser eg. safari, chrome on ios) <br/><br/>
        Simply create a room and invite others,
        then you can communicate p2p using video/audio and collaborate using
        mini-apps in the room (called tabs). Each tab adds a new capability to the
        room. Below are some examples of tab.
        <ul>
          <li>Code editor: a text editor that is synced realtime between all participants</li>
          <li>Chat: send chat messages, supports some markdown as well</li>
          <li>quillpad: a synced rich text editor</li>
          <li>and more</li>
        </ul>
        The tabs are react components using a simple but powerful mini-api available to them
        (using props and some event listners) to add capability to the room.
        This is the coolest feature of this project.
        It aids in easily configurable rooms during creation with features relevant to your
        purpose, while also being able to add more later
        (they are loaded dynamically so they won't take much time to load 🚀 ).
        It's exciting to think of the tabs people will develop.
        <br/>
        Note this app is not made with mobile in mind. Its quite resource intensive, for which
        a laptop/desktop is suitable.
        <br/>
        If you experience connectivity issues it may be because of firewalls or corporate
        network configuration.

        <br/><br/>
        Got some feedback or something to say?
        <br/>
        mail me at <b>oorja.akshay@gmail.com</b> or tweet <b>@uberakshay</b>
        <br/><br/>
        <a href="http://akshay.oorja.io">About me</a>
      </div>
    </section>
  </div>
);

export default Landing;
