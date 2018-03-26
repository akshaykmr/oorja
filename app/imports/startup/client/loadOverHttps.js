/* global window */

// done by the webserver in prod.
const redirectToHttps = () => {
  if (window.location.protocol !== 'https:') {
    window.location = `https://${window.location.hostname}${window.location.pathname}
    ${window.location.hash}`;
  }
};

const { hostname } = window.location;

if (!(hostname === 'localhost' || hostname === '127.0.0.1')) redirectToHttps();
