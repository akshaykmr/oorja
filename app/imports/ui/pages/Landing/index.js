import React from 'react';

import RoomSetup from '../../containers/RoomSetup';
import './landing.scss';

const Landing = () => (
  <div className="landing page">
    <section className="kickstart">
      <div className="tagline">
        Connect and Collaborate
      </div>
      <RoomSetup />
    </section>
  </div>
);

export default Landing;
