
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { extractFirstAndLastName, getPictureForLinkedInUser } from './utils';

Accounts.onCreateUser((options, user) => {
  if (user.services.facebook) {
    const { firstName, lastName } = extractFirstAndLastName(options.profile.name);
    const { id: facebookId, gender } = user.services.facebook;
    return Object.assign(user, {
      loginService: 'facebook',
      profile: {
        firstName,
        lastName,
        gender,
        picture: `https://graph.facebook.com/${facebookId}/picture?width=150`,
        loginService: 'Facebook',
      },
    });
  } else if (user.services.google) {
    const { firstName, lastName } = extractFirstAndLastName(options.profile.name);
    const { picture, gender } = user.services.google;
    return Object.assign(user, {
      loginService: 'google',
      profile: {
        firstName,
        lastName,
        loginService: 'Google',
        picture,
        gender,
      },
    });
  } else if (user.services.twitter) {
    const { screenName } = user.services.twitter;
    return Object.assign(user, {
      loginService: 'twitter',
      profile: {
        firstName: screenName,
        lastName: '',
        picture: `https://twitter.com/${screenName}/profile_image?size=original`,
        loginService: 'Twitter',
      },
    });
  } else if (user.services.github) {
    const { username } = user.services.github;
    return Object.assign(user, {
      loginService: 'github',
      profile: {
        firstName: username,
        lastName: '',
        picture: `https://github.com/${username}.png?size=150`,
        loginService: 'GitHub',
      },
    });
  } else if (user.services.linkedin) {
    const {
      firstName, lastName, publicProfileUrl, accessToken, headline: bio,
    } = user.services.linkedin;
    const picture = getPictureForLinkedInUser(accessToken);
    return Object.assign(user, {
      loginService: 'linkedin',
      profile: {
        firstName,
        lastName,
        picture,
        loginService: 'LinkedIn',
        publicProfile: publicProfileUrl,
        bio,
      },
    });
  } else if (user.services.twitch) {
    const {
      display_name: displayName, bio, logo, _links,
    } = user.services.twitch;
    return Object.assign(user, {
      loginService: 'twitch',
      profile: {
        firstName: displayName,
        lastName: '',
        bio,
        picture: logo,
        loginService: 'Twitch',
        publicProfile: _links.self,
      },
    });
  }

  throw new Meteor.Error('Unrecognized login service');
});
