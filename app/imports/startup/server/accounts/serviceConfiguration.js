import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';

const { github, google, facebook, twitter, linkedin, weibo, reddit, twitch } = Meteor.settings.private;

ServiceConfiguration.configurations.upsert(
  { service: 'github' },
  {
    $set: {
      clientId: github.clientId,
      secret: github.secret,
    },
  }
);

ServiceConfiguration.configurations.upsert(
  { service: 'reddit' },
  {
    $set: {
      appId: reddit.clientId,
      secret: reddit.secret,
    },
  }
);

ServiceConfiguration.configurations.upsert(
  { service: 'google' },
  {
    $set: {
      clientId: google.clientId,
      secret: google.secret,
    },
  }
);

ServiceConfiguration.configurations.upsert(
  { service: 'facebook' },
  {
    $set: {
      appId: facebook.clientId,
      secret: facebook.secret,
    },
  }
);

ServiceConfiguration.configurations.upsert(
  { service: 'twitter' },
  {
    $set: {
      consumerKey: twitter.consumerKey,
      secret: twitter.secret,
    },
  }
);

ServiceConfiguration.configurations.upsert(
  { service: 'linkedin' },
  {
    $set: {
      clientId: linkedin.clientId,
      secret: linkedin.secret,
    },
  }
);

ServiceConfiguration.configurations.upsert(
  { service: 'twitch' },
  {
    $set: {
      clientId: twitch.clientId,
      redirectUri: `${Meteor.absoluteUrl()}_oauth/twitch?close`,
      secret: twitch.secret,
    },
  }
);

ServiceConfiguration.configurations.upsert(
  { service: 'weibo' },
  {
    $set: {
      clientId: weibo.clientId,
      secret: weibo.secret,
    },
  }
);
