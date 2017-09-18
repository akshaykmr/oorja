Package.describe({
  name: 'akshay:twitch-oauth',
  version: '0.0.1',
  summary: 'LoginWithTwitch',
  documentation: 'README.md',
});

Package.onUse(function(api) {
  api.versionsFrom('1.1');

  api.use('accounts-base', ['client', 'server']);
  api.imply('accounts-base');
  api.use('accounts-oauth', ['client', 'server']);
  api.imply('accounts-oauth');

  api.use('oauth', ['client', 'server']);
  api.use('oauth2', ['client', 'server']);
  api.use('http', ['server']);
  api.use('random', 'client');
  api.use('underscore', 'server');
  api.use('service-configuration', ['client', 'server']);

  api.addFiles('accounts-twitch-client.js', 'client');
  api.addFiles('accounts-twitch-server.js', 'server');
  api.addFiles("accounts-twitch.js");

  api.export('TwitchAccounts');
});
