import './routes.js';

// collections
import '../../collections/client';
import '../../collections/common';

import './attemptReconnection';

// this should be done by the webserver, here for dev deployment
if (window.location.protocol !== 'https:') {
  window.location = `https://${window.location.hostname}${window.location.pathname}
  ${window.location.hash}`;
}
