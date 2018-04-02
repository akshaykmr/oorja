import { HTTP } from 'meteor/http';

export const extractFirstAndLastName = fullName => ({
  firstName: fullName.split(' ')[0].trim(),
  lastName: fullName.split(' ').slice(1).reduce((str, word) => `${str} ${word}`, '').trim(),
});

export const getPictureForLinkedInUser = (token) => {
  const { data } = HTTP.call(
    'GET',
    'https://api.linkedin.com/v1/people/~:(id,location,picture-url,specialties,public-profile-url,email-address,formatted-name)?format=json',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 3000,
    },
  );
  return data.pictureUrl || '';
};
