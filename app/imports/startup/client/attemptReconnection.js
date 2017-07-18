import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

let intervalId = null;

const reconnectToServer = (timeOut, verbose = Meteor.isDevelopment) => {
  Tracker.autorun(() => {
    // Start Pinging For Reconnect On Interval, only if status is failing and intervalId is null
    if (intervalId === null) {
      if (Meteor.status().status === 'waiting' || Meteor.status().status === 'failed') {
        intervalId = Meteor.setInterval(() => {
          if (verbose) {
            console.log(`Client Status: ${Meteor.status().status}`);
          }
          Meteor.reconnect();
          if (verbose) {
            console.log(`Client Status: ${Meteor.status().status}`);
          }
        }, timeOut);
      }
    } else if (intervalId != null) {
    // Stop Trying to Reconnect If Connected, and clear Interval
      if (Meteor.status().status === 'connected') {
        if (verbose) {
          console.log(`Client Status: ${Meteor.status().status}`);
        }
        Meteor.clearInterval(intervalId);
        intervalId = null;
      }
    }
  });
};

reconnectToServer(5000);

