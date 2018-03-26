import { Meteor } from 'meteor/meteor';
import { Position, Toaster } from '@blueprintjs/core';

// SupremeToaster is the main app toaster.
// Cant create it on the server due because it depends on `document`
const SupremeToaster = Meteor.isServer ? {} : Toaster.create({ className: 'supreme-toaster', position: Position.TOP });

export default SupremeToaster;
