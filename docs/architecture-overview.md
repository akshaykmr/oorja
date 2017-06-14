# Project overview

The purpose of this document is to give you a nice overview of the project and its components. If you haven't already, [try the app](https://oorja.io) before reading further. I will try to be brief with enough links for more information wherever needed.

oorja is a single page web application made with a [React](https://facebook.github.io/react/) frontend and [Meteor js](https://www.meteor.com/) at backend.

Currently the larger chunk of this project is frontend React code. The component approach imo feels just right for this app.
The backend as of now is only concerned with some basic operations such as room creation, adding users and permissions; Pub/Sub for room document and handling OAuth for login with external services.

Why Meteor? Well tbh it started with laziness of not having to setup/configure the build chain for a react project 😣. Later on I stuck with it as its an excellent build tool with good community and packages. It's realtime by default, has pub/sub, and it's also got ready to use oauth packages for popular services.


oorja also uses some of the latest technology in web browser namely 
[WebRTC](http://webrtc-security.github.io/) which allows for Real time communications between browsers. This is used for sharing video/audio and data between room participants. The previously linked page describes a typical webrtc application with signalling server and some involved technologies such as ICE, STUN and TURN. For the webRTC part of this project oorja uses another open source project [licode](http://lynckia.com/licode/index.html). Rather than implementing a custom signalling server oorja uses licode since it offers more benefits such as 
 - Abstracted API for managing streams (not having to deal with cross browser quirks).
 - In active development, distributed and helps in seperation of concerns.
 - Apart from videoconferencing it can be used for streaming and recording.
 - By default oorja uses p2p model which gives good quality 1:1 video calls, but quality is likely to degrade with many more people. If needed the mcu of licode can be used to relay video stream to other clients. This results in less cpu usage (full mesh vs star topology) for each client albiet more server costs(due to the relay server, hence disabled for now).

That's it. Up next, [project setup](./project-setup.md)