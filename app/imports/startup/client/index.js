/* global window */
import './routes.js';

// collections
import '../../collections/client';
import '../../collections/common';

import './attemptReconnection';

// this should be done by the webserver, here for dev deployment temporarily
const redirectToHttps = () => {
  if (window.location.protocol !== 'https:') {
    window.location = `https://${window.location.hostname}${window.location.pathname}
    ${window.location.hash}`;
  }
};

if (!(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) redirectToHttps();
