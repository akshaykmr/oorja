// server only collections
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

Meteor.users.deny({ update: () => true });


export const Rooms = new Mongo.Collection('room');

export default Rooms;
