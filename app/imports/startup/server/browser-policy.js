import { Meteor } from 'meteor/meteor';
import { BrowserPolicy } from 'meteor/browser-policy-common';
// e.g., BrowserPolicy.content.allowOriginForAll( 's3.amazonaws.com' );

BrowserPolicy.content.allowSameOriginForAll();
BrowserPolicy.content.allowDataUrlForAll();
BrowserPolicy.content.allowOriginForAll('blob:');
BrowserPolicy.content.allowConnectOrigin('*');
BrowserPolicy.content.allowImageOrigin('*');
BrowserPolicy.content.allowOriginForAll(Meteor.settings.public.cdnURL);
