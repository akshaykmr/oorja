import { SyncedCron } from 'meteor/percolate:synced-cron';
import moment from 'moment';

import { Rooms } from 'imports/collections/common';

SyncedCron.add({
  name: 'Archive rooms when their validity expires', // rooms are archived after 4 days
  schedule: parser => parser.text('every 6 hours'), // parser is a later.parse object
  job: () => {
    const now = moment();
    const selector = {
      archived: false,
      validTill: { $lt: now.toDate().getTime() },
    };
    const modifier = {
      $set: { archived: true },
    };
    const updatedDocuments = Rooms.update(selector, modifier, { multi: true });
    return updatedDocuments;
  },
});

SyncedCron.start();
