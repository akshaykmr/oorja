import { HTTP } from 'meteor/http';
import { Accounts } from 'meteor/accounts-base';

// this code needs some refactoring later.

// modifies user document before creating it.
// http://docs.meteor.com/api/accounts-multi.html#AccountsServer-onCreateUser
Accounts.onCreateUser((options, user) => {
  /* eslint-disable */
  if (user.services.facebook) {
    // user.emails=[];
    user.loginService = 'facebook';
    options.profile.loginService = 'Facebook';
    const facebookId = user.services.facebook.id;
    options.profile.picture = `https://graph.facebook.com/${facebookId}/picture?width=500`;
    options.profile.gender = user.services.facebook.gender;
  } else if (user.services.google) {
    user.loginService = 'google';
    options.profile.loginService = 'Google';
    const pictureLink = user.services.google.picture;
    delete user.services.google.picture;
    options.profile.picture = pictureLink;
    // GOOGLE PICTURE IS TOO BIG
    options.profile.gender = user.services.google.gender;
  } else if (user.services.twitter) {
    user.loginService = 'twitter';
    options.profile.loginService = 'Twitter';
    options.profile.picture = `https://twitter.com/${options.profile.name}/profile_image?size=original`;
    options.profile.firstName = user.services.twitter.screenName;
    user.profile = options.profile;
  } else if (user.services.github) {
    user.loginService = 'github';
    const { github } = user.services;
    user.profile = {
      firstName: github.username,
      lastName: null,
      loginService: 'Github',
      picture: `https://github.com/${github.username}.png?size=500`,
    };
  } else if (user.services.linkedin) {
    user.loginService = 'linkedin';
    const { linkedin } = user.services;

    // get picture from linkedIn api
    const { data } = HTTP.call(
      'GET',
      'https://api.linkedin.com/v1/people/~/picture-urls::(original)?format=json',
      {
        headers: {
          Authorization: `Bearer ${linkedin.accessToken}`,
        },
        timeout: 5000,
      }
    );
    // console.log(data);
    user.profile = {
      firstName: linkedin.firstName,
      lastName: linkedin.lastName,
      loginService: 'LinkedIn',
      picture: data.values ? data.values[0] : null,
      publicProfile: linkedin.publicProfileUrl,
      bio: linkedin.headline,
    };
  } else if (user.services.twitch) {
    user.loginService = 'twitch';
    const { twitch } = user.services;
    user.profile = {
      firstName: twitch.display_name,
      bio: twitch.bio,
      loginService: 'Twitch',
      publicProfile: twitch._links.self,
      picture: twitch.logo,
    };
  }

  if (user.services.facebook || user.services.google) {
    const name = options.profile.name;
    delete options.profile.name;

    options.profile.firstName = name.split(' ')[0];
    options.profile.lastName = name.split(' ')[1];
    user.profile = options.profile;
  }
  return user;
  /* eslint-enable */
});


// setups profile
/*
  {
    firstName,
    lastName,
    picture
  }

*/
