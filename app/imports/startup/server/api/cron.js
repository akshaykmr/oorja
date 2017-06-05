import { SyncedCron } from 'meteor/percolate:synced-cron';
import { moment as Moment } from 'meteor/momentjs:moment';

import { Rooms } from '../../../collections/common';

SyncedCron.add({
  name: 'Archive rooms when their validity expires', // rooms are archived after 4 days
  schedule: parser => parser.text('every 6 hours'), // parser is a later.parse object
  job: () => {
    const now = new Moment();
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
