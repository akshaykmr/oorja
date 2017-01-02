// common collections
// subscribed/fetched data acts as a mongo cache on the client
// some properties may not be sent to the client ofc.
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

Meteor.users.deny({ update: () => true });


export const Rooms = new Mongo.Collection('room');
/*
  {
    roomName,
    passwordEnabled,
    password,
    participants: [
      {
        id,
        profile
      }
    ]
    createdAt
  }

*/

export default Rooms;
