import React from 'react';

import RoomSetup from '../../containers/RoomSetup';
import Oorja from '../../components/Oorja';
import './landing.scss';

const Landing = () => (
  <div className="landing page">
    <section className="kickstart">
      <div className="tagline">
        finish this project already
      </div>
      <div className="logoJazz">
        <Oorja />
      </div>
      <div className="room-form">
        <RoomSetup />
      </div>
    </section>
  </div>
);

export default Landing;
