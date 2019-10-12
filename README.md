### <span><img src="http://svgshare.com/i/1pX.svg" alt="" height="20px" width="20px"/> oorja (alpha version) </span> 

##### Project status
This repository contains an alpha version, with minimal components to make things work.
It was made while I was in college(2017), I'd do a lot of things differently now, particularly in terms of code organization and overall architecture. Never the less, it was super fun to make back then. I'm still keeping this repo up, up because it feels good to look back at how far you've come.

With the next iteration I plan to develop a more fine tuned and robust experience, with some new tools - Elixir ❤️ and Typescript. Cheers!

----

> oorja is a quick to use video/voice chat application with realtime collaborative features. [Visit oorja.io](https://oorja.io) to see it in action.

<p align="center">
    <img align="center" height="500px" src="https://d1laijbq9p776p.cloudfront.net/screenshare2.png" alt=""/>
</p>

> There is a concept of mini-applications called tabs each of which add a unique capability to the room. They are loaded dynamically with a click of a button

<p align="center">
    <i> Code editor for quick snippets. Synced realtime between all participants </i> <br/><br/>
    <img align="center" height="350px" src="https://d1laijbq9p776p.cloudfront.net/codepad_demo2.gif" alt=""/>
</p>
<br/>
<p align="center">
    <i> Chat, simple and private. supports some markdown as well </i> <br/><br/>
    <img align="center" height="400px" src="https://d1laijbq9p776p.cloudfront.net/chat_demo2.gif" alt=""/>
</p>
<br/>
<p align="center">
    <i> Quillpad, a synced rich text editor </i> <br/><br/>
    <img align="center" height="350px" src="https://d1laijbq9p776p.cloudfront.net/quill_demo2.gif" alt=""/>
</p>
<br/><br/>

- All video and voice comms are encrypted. None of the data in your tabs is stored on the server; it gets synced from one participants browser to another 🔮. There are no ads or tracking on this website.

- oorja is built with React, WebRTC, Meteor and Elixir. It is extensible by design. The tabs are react components which utilize a simple but powerful mini-api (using props and some event listeners) to add more capabilities to the room on demand.

##### Note
 -  This project uses some of the latest technologies in modern web browsers namely WebRTC that enables p2p communication (It may not be supported in your browser eg. safari). Use Chrome or Firefox
 -  If you are using chrome you will need to install the [screensharing extension](https://chrome.google.com/webstore/detail/oorja-screensharing/kobkjhijljmjkobadoknmhakgfpkhiff?hl=en-US) to be able to share your screen.

### License
oorja (alpha version) is free for personal non commercial use.
Copyright © 2019 Akshay Kumar akshay.kmr4321@gmail.com


### I'd like to tinker with this project!
In order to do so please go through the following docs **in the given order.**
Also, It's quite easy to make tabs (you only need to know some react, which can itself be picked up in a weekend).
 1. [Project Overview](docs/project-overview.md)
 2. [Project Setup](docs/project-setup.md)
 3. [Making a Tab](docs/make-a-tab.md)

### Contact

You can reach me at akshay.kmr4321@gmail.com or <a href="https://twitter.com/uberakshay/">Twitter</a> 

### About me
Hi, I'm Akshay Kumar and I am a product engineer. [Visit my website to know more](http://akshay.oorja.io/)

