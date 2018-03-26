import { onPageLoad } from 'meteor/server-render';
import renderLandingPage from './landing';

onPageLoad((sink) => {
  const path = sink.request.url.pathname;
  switch (path) {
    case '/': renderLandingPage(sink);
      break;
    default:
  }
});
