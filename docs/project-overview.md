# Project overview

The purpose of this document is to give you a high level overview of the project and its components. If you haven't already, [try the app](https://oorja.io) before reading further. I will try to be brief with enough links for more information wherever needed.

oorja is a single page web application made with a [React](https://facebook.github.io/react/) frontend and [Meteor js](https://www.meteor.com/) at backend. There is also a backend microservice [Beam](https://github.com/akshayKMR/beam) that is made with [Elixir](https://elixir-lang.org/) and [Phoenix framework](http://phoenixframework.org/). Together this forms the core of the project.


The meteor backend as of now is only concerned with some basic operations such as CRUD for room creation/management, crons, handling OAuth for login with external services.

[Beam](https://github.com/akshayKMR/beam) microservice is used for soft-realtime messaging between room participants and also relaying important events that happen at the backend. Why elixir and phoenix ? Well they felt like the perfect tool I could use for this purpose. It's fault tolerant, highly availabile and distributed. You get a lot of stuff for free.


At the frontend oorja uses some of the latest technology in web browser namely 
[WebRTC](http://webrtc-security.github.io/) which allows for Real time communications between browsers. This is used for sharing video/audio between room participants. Encryption is a mandatory feature of webrtc.
The above link describes a typical webrtc application with signaling server and some involved technologies such as ICE, STUN and TURN.

The public deployment at https://oorja.io does not use a TURN server because it is expensive. So for some people behind double NATs, corporate firewall video/voice chat will not work.

Apart from stun and turn servers there are also media servers, These are optional.
By default oorja uses p2p mode which gives good quality video calls upto ~4 participants,but it is not scalable and heavy on users cpu. To alivieate this a media server can be used to relay one users stream to all, i.e a star topology with media server in between to do the heavy lifting compared to full mesh peer to peer. Media servers can also be used for processing, recording.
[licode](http://lynckia.com/licode/index.html) was used for this purpose in previous version on oorja. In upcoming versions there will be an interface for such media servers.


That's it. Up next, [project setup](./project-setup.md)