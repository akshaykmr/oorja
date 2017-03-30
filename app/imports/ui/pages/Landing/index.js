import React from 'react';

import RoomSetup from '../../containers/RoomSetup';
import './landing.scss';

const Landing = () => (
  <div className="landing">
    <section className="kickstart">
      <div className="intro">
        <div className="branding">
          Peery
        </div>
        <div className="text">
          Consectetur exercitation tempor ex ut nulla Lorem pariatur esse
          tempor duis consectetur. Commodo commodo sunt
          nostrud irure duis sint proident exercitation
          dolore eiusmod. Mollit eu cillum velit proident cillum
          ut mollit velit aliquip laborum. Non velit magna quis dolore
          ut nulla mollit duis commodo non ipsum. Eu laboris esse officia
          occaecat anim reprehenderit incididunt excepteur non ex consectetur.
          Consectetur eu culpa veniam id veniam dolor nostrud irure sunt ex sint.
          Consequat exercitation occaecat mollit officia eu fugiat id irure magna proident.
        </div>
      </div>
      <div className="room-form">
        <RoomSetup />
      </div>
    </section>
    <section className="about">
      <div>
        Occaecat incididunt veniam aute amet.
        Fugiat duis officia in ad incididunt irure elit anim.
        consequat.
      </div>
   </section>
  </div>
);

export default Landing;
