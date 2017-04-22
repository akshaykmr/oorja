import { BrowserPolicy } from 'meteor/browser-policy-common';
// e.g., BrowserPolicy.content.allowOriginForAll( 's3.amazonaws.com' );

BrowserPolicy.content.allowSameOriginForAll();
BrowserPolicy.content.allowDataUrlForAll();
BrowserPolicy.content.allowOriginForAll('blob:');
BrowserPolicy.content.allowConnectOrigin('https://*.oorja.io');
BrowserPolicy.content.allowImageOrigin('*');
