import { Meteor } from 'meteor/meteor';

const AppHelper = {
  cdnURL: Meteor.settings.public.cdnURL,
};

export default AppHelper;
