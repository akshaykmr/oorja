// common collections
// subscribed/fetched data acts as a mongo cache on the client

import { Mongo } from 'meteor/mongo';

const Rooms = new Mongo.Collection('room');

export default Rooms;
