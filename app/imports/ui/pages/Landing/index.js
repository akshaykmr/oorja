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
    </section>
  </div>
);

export default Landing;
