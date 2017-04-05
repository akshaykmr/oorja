import React from 'react';

import RoomSetup from '../../containers/RoomSetup';
import './landing.scss';

const Landing = () => (
  <div className="landing">
    <section className="kickstart">
      <div className="tagline">
        finish this project already
      </div>
      <div className="room-form">
        <RoomSetup />
      </div>
    </section>
  </div>
);

export default Landing;
