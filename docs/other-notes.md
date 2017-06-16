This place is really just a collection of random thoughts, ideas and improvements from which I select something to work upon. This only works for single person though, a better approach would be to use issues or a project tracker.

#### UX
- The landing page is terrible. Does not show how to use the app or what to expect from it. Need to put some pictures, graphics, or maybe gifs in there.
- svg animation on landing page looks cool but the average user won't understand what I was thinking of when I made it. Also need to give credit to the person who made that svg somewhere.
- need to make customization better. A big form won't look good when putting more options in there.
- A random room name is generated when directly clicking the create room button using the structure `adjective adjective noun` and a default wordlist.  During development some interesting room names were generated
    + bitty-unpropped-handicaps
    + faecal-quinate-baseballs
    + fractious-pussy-physicians
    + backstage-spousal-responsibilities
these do not sound that welcoming haha. Need to filter out only positive adjectives and nouns for room name generation.
- Need to show proper reasoning and course of action for unsupported browsers, failed media device access etc. generic errors dont help so much
- Need to make a helpcenter tab for common help. could possibly make an article format and add a roomAPI for tabs to load their articles in the helpcenter.
- Room info tab only allows to copy room link to share room access. Maybe explore more available options using the api integrations from OAuth service used for login.
- Maybe play a little sound when users join/leave.
- need to rethink the logic for selecting focussed video stream in video chat tab.


#### Frontend
- Need to utilize RTCDataChannel for sending messages between peers. Currently erizoController is being used. This change should not have any effect on RoomAPI, and should cause minimal changes in Messenger.js file. Room.js ought to experience most of the changes.
- The `tabReady` function and `REMOTE_TAB_READY` event logic needs to be probed for accuracy. They are kind of wonky which could lead to erroneous messaging.
- The React Developer tools extension reports development mode when running in production on oorja.io. Need to configure it for production mode - will likely see smaller bundle size and some improved performance.
- Room.js file has gotten quite big, need to move streamHandling logic to a different file.
- Need to make a tab for configuring room/webcam/bandwidth settings. Currently you can only select quality settings for webcam before joining the room.
- Extend Room API to allow publishing custom Erizo.Streams (you can stream video files with it as well)
- Explore recording option available in licode for non-p2p rooms.
- reorganize files for more relevance
- dynamic import of tabs works well on local development but doesn't work on production deployment for safari. need to look into this (safari is not supported as it doesn't have webrtc support, but this issue could indicate some problem in my code) Should probably try making a sample app to test dynamic import quickly for it.
- indexeddb may not be supported in private mode of the browser. need to see how to handle this.


#### Backend
- Allow for more customization in room creation method (inital tabs, login restrictions etc.)
- look into user roles for selectively allowing publish/subscribe of media streams.
- Make use of API integrations from the login services used (github, facebook, linkedIn, goodle) to expose more available actions for the user in RoomAPI?
- Expose an api for Room Creation ?  eg POST /new
``` 
    {
        roomName,
        apiKey,
        tabIdList,
        ... more configuration options
    }
```

returns a room URL that can be embed/used in an iframe.

- Currently only p2p mode for the room is used, It would be nice to know stats and cpu usage if the mcu were to be used. possibly a graph of cpu and bandwidth usage vs. number of subscribers for a fixed video quality.



#### Deployments
- Try out the load balancer configuration.
- ssl certificate is about to expire. use certbot to renew them - **REMEMBER**
- promo credits on aws about to run out. terminate aws_oregon instance.
- Need to monitor app performance and cpu usage.
- Setup some logging utility (use bugsnag?)
- redirect dev.oorja.io to https from the webserver and not from the client side.
- Use CDN for static assets


#### Testing
- I've no experience in testing an app with so many parts. There is an app server, frontend, licode, over the network methods. Need to research how its done properly before proceeding.
