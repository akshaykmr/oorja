import { onPageLoad } from 'meteor/server-render';
import renderLandingPage from './landing';

onPageLoad((sink) => {
  const path = sink.request.url.pathname;
  console.log(path)
  if (path === '/') { // landing page
    renderLandingPage(sink);
  }
});
