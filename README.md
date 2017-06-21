# <span><img src="http://svgshare.com/i/1pX.svg" alt="" height="40px" width="40px"/> oorja </span> 

[![Join the chat at https://gitter.im/oorja-io/Lobby](https://badges.gitter.im/oorja-io/Lobby.svg)](https://gitter.im/oorja-io/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
<span>Alpha version</span>


[![CircleCI](https://circleci.com/gh/akshayKMR/oorja/tree/master.svg?style=svg&circle-token=4a0bb88da10bed1c0242fbd0a050f1dab2986e2b)](https://circleci.com/gh/akshayKMR/oorja/tree/master) [![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0) <span class="badge-patreon"><a href="https://www.patreon.com/oorja" target="_blank" title="Donate to this project using Patreon"><img src="https://img.shields.io/badge/patreon-donate-yellow.svg" alt="Patreon donate button" /></a></span>
<span class="badge-bitcoin"><a href="#donate" title="Donate once-off to this project using Bitcoin"><img src="https://img.shields.io/badge/bitcoin-donate-yellow.svg" alt="Bitcoin donate button" /></a></span>



#### oorja is a fully open source, quick to use video/voice chat application with realtime collaborative features.

##### To describe this project in a simple, straighforward way: 
- The objective is to collaborate quickly, securely and privately.
- By clicking the create room button the app creates a room with a unique link. Only those with this unique link (and password if set) can join the room. Simply share this link and you are set.
- Before joining the room you may test your webcam/mic with option to mute them.
- Sign in is optional and not restriced to one service. Anyone with access to the room can join anonymously or by using their existing account from Twitter, Facebook, Google, Github etc.
- This is where things get exciting. Now that you are in the room, There is a concept of mini-applications called tabs each of which add a unique capability to the room.
    + Video chat with screensharing
        <img height="500px" src="http://imgur.com/oYNdefL.png" alt=""/>


    + Quillpad, a synced rich text editor
        <img height="350px" src="http://imgur.com/ouc1Y37.gif" alt=""/>


    + Chat, simple and private. supports some markdown as well

        <img height="400px" src="http://imgur.com/AVSXJ3s.gif" alt=""/>


    + CodePad with syntax highligting. synced realtime between all participants
        <img height="350px" src="http://imgur.com/Mh5Kyl1.gif" alt=""/>


    + Discover Tabs (Add tabs dynamically to the room when needed with a click of a button 🙌)
        <img height="400px" src="http://imgur.com/6gpnI9d.gif" alt=""/>

- Some tabs are added by default and more can be added later. In future there will be more customization available when creating the room. Also, most of the current tabs are strictly p2p, i.e. no data in the CodePad/ Chat / QuillPad etc. is stored on the server. The content is synced peer to peer between the room participants.

- The tabs are react components using a simple but powerful mini-api (using props and some event listeners) to add more capabilities to the room. This is the **coolest feature of this project**. It aids in easily configurable rooms during creation with features relevant to your purpose, while also being able to add more later (they are loaded dynamically, so only the required code is executed). It's exciting to think of the tabs people will develop leveraging the super easy p2p interace/api in oorja. Continue reading to know more about how you can contribute.

##### Note
 -  oorja is built upon some of the latest technologies in modern web browsers namely WebRTC that enables p2p communication (It may not be supported in your browser eg. safari). Use Chrome or Firefox
 -  This is an alpha version with a long way to go. Feel free to give it a spin but I cannot guarantee an error free experience.
 -  If you are using chrome you will need to install the [screensharing extension](https://chrome.google.com/webstore/detail/oorja-screensharing/kobkjhijljmjkobadoknmhakgfpkhiff?hl=en-US) to be able to share your screen.

---

### How to contribute ?
You are welcome to contribute! In order to do so please go through the following docs in the given order.
Also, It's quite easy to make tabs (you only need to know some react, which can itself be picked up in a weekend).

The docs may seem too much at first but the info is there to give you the big picture and context to make you feel more confident.
The docs start with a high level overview, followed by how to get the project running and finally how you can tinker and improve it.
 1. [Project overview](docs/project-overview.md)
 2. [Project Setup](docs/project-setup.md)
 3. [Making a Tab](docs/make-a-tab.md)

[Other notes](docs/other-notes.md)

### License
oorja is licensed under Apache 2.0 <br>
It is a personal project, but I feel it can be made much better with help of a few contributors, and for that reason I've chosen this OSS license; not to forget, it is made possible only by leveraging other OSS projects.

### Donate ❤️
As mentioned earlier this is a personal project. There are no ads, tracking, premium paid features etc. To continue its development and finance the server costs of [oorja.io](https://oorja.io) I would really appreciate your financial backing

<span class="badge-patreon"><a href="https://www.patreon.com/oorja" target="_blank" title="Donate to this project using Patreon"><img src="https://img.shields.io/badge/patreon-donate-yellow.svg" alt="Patreon donate button" /></a></span>
<br>
<span class="badge-bitcoin"><a id="donate" href="#donate" title="Donate once-off to this project using Bitcoin"><img src="https://img.shields.io/badge/bitcoin-donate-yellow.svg" alt="Bitcoin donate button" /></a></span> <code> 1FzAAeMPxdBBhcuXH8XDfXKq5GTcBUncHT </code>


### Contact
You can reach me at oorja.akshay@gmail.com or <a href="https://twitter.com/uberakshay/">Twitter</a> 
### [About me](http://akshay.oorja.io/)