import React from 'react';
import PropTypes from 'prop-types';

import RoomSetup from 'imports/ui/components/RoomSetup';
import MinimalLogo from 'imports/ui/components/MinimalLogo';

import {
  EyeOff,
  Github,
  Mail,
  Twitter,
  MessageCircle,
  LifeBuoy,
  CornerRightDown,
  GitBranch,
  Globe,
} from 'imports/ui/components/icons';
import Paypal from 'imports/ui/components/icons/Paypal';
import Coins from 'imports/ui/components/icons/Coins';

import Navigation from './Navigation';

const Landing = props =>
  (
    <div className="landing page">
      <Navigation />
      <div className="logo">
        <MinimalLogo />
        <div className="oorjaTitle">
          <span className="logo-title">oorja</span>
        </div>
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
          <div className="header">How it works <CornerRightDown/></div>
          <div className="step"> Simply create a room and share the link to invite others,
          then you can communicate privately using video/audio and collaborate using
          mini-apps called tabs. </div>

          <ul className="previewReel">
            <li>
              <div className="preview"><img src="https://d1laijbq9p776p.cloudfront.net/screenshare2.png" alt=""/></div>
              <div className="title">A room with video chat and screensharing </div>
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
            <li>
              <div className="title">and more ...</div>
            </li>
          </ul>

          <hr/>

          <div className="navSection">
            <div id="privacy" className="navTarget">
              <div className="icon"><EyeOff /></div>
              <div className="label"> Privacy </div>
            </div>
            <div className="content">
              <i>
                All video and voice comms are encrypted.
                None of the data in your tabs is stored on the server; it
                gets synced from one participants browser to another</i> 🔮<i>.
                There are no ads or tracking on this website.
              </i>
            </div>
          </div>

          <div className="navSection">
            <div id="donate" className="navTarget">
              <div className="icon"><Coins /></div>
              <div className="label"> Donate </div>
            </div>
            <div className="content">
              oorja is a personal project.
              It would be splendid if you could contribute towards financing its
              server and development costs.
              <br/>
              <div className="iconAnchor">
                <a href="https://www.paypal.me/akshaykmr/" target="_blank" rel="noopener noreferrer"> <Paypal/> </a>
              </div>
            </div>
          </div>

          <hr/>

          <div className="navSection">
            <div id="develop" className="navTarget">
              <div className="icon"><Github /></div>
              <div className="label"> Contribute with code </div>
            </div>
            <div className="content">
              oorja is open source and free for personal use. It is built with React, WebRTC,
              Meteor and Elixir. <br/>
              It is extensible by design. The tabs are react components which utilize a simple but
              powerful mini-api (using props and some event listeners) to add more capabilities
              to the room on demand.
              <br/>
              <br/>
              <div className="iconAnchor">
                <GitBranch/><a href="https://github.com/akshayKMR/oorja" target="_blank" rel="noopener noreferrer"> Fork oorja at GitHub</a>
              </div>
            </div>
          </div>

          <hr/>

          <div className="navSection">
            <div id="help" className="navTarget">
              <div className="icon"><LifeBuoy /></div>
              <div className="label"> Things to note </div>
            </div>
            <div className="content extraInfo">
              <ul>
                <li>
                  If you experience connectivity issues, well, note that the app is
                  still alpha version. Also, It may be because of firewalls or some
                  corporate network configuration.
                </li>
                <li>
                  oorja.io uses peer to peer connections for media, this is suitable
                  for rooms with upto 4 participants. To support more you can deploy your
                  own oorja instance with a media server to do the heavy lifting 💪
                </li>
              </ul>
            </div>
          </div>

          <hr/>
          <div className="navSection">
            <div id="contact" className="navTarget">
              <div className="icon"><MessageCircle /></div>
              <div className="label"> Contact </div>
            </div>
            <div className="content">
              {`Hi, My name is Akshay Kumar and I am a product engineer. oorja is
              a personal project of mine.`}
              <br/> <br/>
              <div className="iconAnchor">
                <Globe/><a href="https://akshay.oorja.io" target="_blank" rel="noopener noreferrer"> Visit my website: akshay.oorja.io </a>
              </div>
              <br/>
              <span style={{ fontSize: '1.3em' }}> Got some feedback or something to say? </span>
              <br/> <br/>
              <div className="iconAnchor">
                <Mail/><a href="mailto:akshay.kmr4321@gmail.com?Subject=Hello%20Akshay"> email me: akshay.kmr4321@gmail.com</a>
              </div>
              <br/>
              <div className="iconAnchor">
                <Twitter/><a href="https://twitter.com/uberakshay" target="_blank" rel="noopener noreferrer"> reach out to me on twitter @uberakshay</a>
              </div>
            </div>
          </div>

      </section>

    </div>
  );

Landing.propTypes = {
  history: PropTypes.object.isRequired,
};

export default Landing;
