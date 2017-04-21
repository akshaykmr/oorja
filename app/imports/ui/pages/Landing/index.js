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
        Connect and Collaborate
      </div>
      <div className="minimalDescription">
        Quick and secure Video, Voice chat and <strong>much more! </strong>
      </div>
      <RoomSetup />
    </section>
    <section className="about">
    </section>
  </div>
);

export default Landing;
