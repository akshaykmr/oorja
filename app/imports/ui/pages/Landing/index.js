import React from 'react';

import RoomSetup from '../../containers/RoomSetup';
import './landing.scss';

const Landing = () => (
  <div className="landing">
    <section className="kickstart">
      <div className="tagline">
        Simple Secure Meetings
      </div>
      <div className="room-form">
        <RoomSetup />
      </div>
    </section>
  </div>
);

export default Landing;
