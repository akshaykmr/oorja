/* global WebAppInternals*/
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

if (Meteor.isProduction) {
  WebAppInternals.setBundledJsCssPrefix(Meteor.settings.public.cdnURL);
}

/* eslint-disable no-underscore-dangle*/
WebApp.rawConnectHandlers.use((req, res, next) => {
  if (req._parsedUrl.pathname.match(/\.(ttf|ttc|otf|eot|woff|woff2|font\.css|css)$/)) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  next();
});
/* eslint-enable no-underscore-dangle*/
