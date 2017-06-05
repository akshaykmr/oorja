import { Meteor } from 'meteor/meteor';
import bugsnag from 'bugsnag';

if (Meteor.settings.private.enableBugsnag) {
  bugsnag.register(Meteor.settings.private.bugsnagKey);
}

