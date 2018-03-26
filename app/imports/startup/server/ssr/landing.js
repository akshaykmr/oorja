import React from 'react';
import { renderToString } from 'react-dom/server';
import Landing from 'imports/ui/pages/Landing/';

const LandingPage = () =>
  (
    <div>
      <div className="versionTag">
        <a href="https://github.com/akshayKMR/oorja" target="_blank" rel="noopener noreferrer">
          <strong>ALPHA</strong>
        </a>
      </div>
      <Landing history={{}} />
    </div>
  );

const renderedDom = renderToString(<LandingPage />);

const render = (sink) => {
  sink.renderIntoElementById('react-root', renderedDom);
};


export default render;
