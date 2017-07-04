# Project setup
This document will describe how to get the project running. I would recommend a *nix machine (ubuntu/mac) for all development purposes and my instructions will cater to them.
In brief you would be
 - installing the meteor tool if you do not have it
 - installing the node module dependencies
 - setting up a licode instance
 - filling the development settings in `settings-development.json`
 - phew! running the App! 🙏

**Fork the repo.** If you aren't used to forking model [this page is a good start.](https://help.github.com/articles/working-with-forks/)
Now clone your fork and continue.

### File structure

`/app` contains the meteor app.
The **application strucure** of the project in `/app` is similar to one described in [these docs](https://guide.meteor.com/structure.html#javascript-structure). All the code stays in this directory.
All the commands to run the project etc. are to be executed in this directory.

`/build` output directory for the built application. Its contents are ignored in git.

`/chrome-extension` is the unpacked chrome extension used for screen sharing.

`/docs` contains documentation.

## Lets get started

#### Setting up the web app

- `$ cd /app`
- [install the meteor tool](https://www.meteor.com/install)
- install the node dependencies `$ meteor npm install`
- Now in order to configure the environment settings for the application a file called `settings-development.json` is needed. A sample file called `settings-example.json` is provided. simply copy it's contents into a new file named `settings-development.json` in the same directory.  We will fill in it's contents later.
- Try running the app. `meteor npm start` This should start the development server at `localhost:3000`. Do not try using the app though as we still need to setup licode and plug its settings in `settings-development.json`

#### Setting up licode
You must have [docker installed](https://www.docker.com/community-edition).

1.  Pull the image 
 `$ docker pull akshaykmr/licode-oorja:0.1` 
 
**Note:** This image is not modified from the official licode images which can be [found here](https://hub.docker.com/r/lynckia/licode)
The only difference is that this image is built with a licode version tested with oorja, so `licode-oorja:0.1` image works with oorja release `0.1.X` and so on.


2. Start licode with the following command in the terminal

 `MIN_PORT=30000; MAX_PORT=30050;  docker run --name licode -p  3010:3000 -p $MIN_PORT-$MAX_PORT:$MIN_PORT-$MAX_PORT/udp -p   3015:3001  -p 8080:8080 -e "MIN_PORT=$MIN_PORT" -e "MAX_PORT=$MAX_PORT" -e "PUBLIC_IP=127.0.0.1" licode-oorja:0.1`
 
  This will start a licode instance and map necessary ports on your local machine. Once licode starts look out for two logs   in the console output:
  
 ```
 [licode] SuperService ID 59577ce54c59534e64cb345c 
 [licode] SuperService KEY 20067
 ```
 Your ID and Key will obviously be different.

3. Now keep this running in a terminal tab and plug these values in `settings-development.json` in Nuve configuration. Like so
```
    ...
    "Nuve": {
      "serviceName": "local",
      "serviceId": "59577ce54c59534e64cb345c",
      "serviceKey": "20067",
      "host": "http://127.0.0.1:3010/"
    },
    ...
```
If you have any comments in your `settings-development.json` remove them as it's not valid JSON.

#### Run the app
- With all settings in place the app should be able to run 🙏
 `$ meteor npm start` 
 Go to localhost:3000 and create a new Room!
 
 Don't worry if some error comes in the above steps, reach out to me and I'll try my best to update the docs accordingly.
- To simulate joining the with another user use a incognito window to open the same room link. Since the session is not shared you can test 2 users interacting locally 👍
- Advanced users may want to setup licode on a VPS so that you can test the app on different devices and other use cases.

[**More details on settings-development.json**](./settings-development.md)

[**More information on licode architecture**](https://github.com/lynckia/licode/issues/335#issuecomment-127547113)


#### Dev setup

- I would recommend you use [visual studio code](https://code.visualstudio.com/) with the following extensions
    + babel es6/es7
    + color highlight
    + eslint
    + npm intellisense
    + path autocomplete
    + sass
    + scss intellisense
    + stylelint
    + sublime babel

eslint plugin is vital. Without it your build won't pass so ensure that it works properly.

<img src="http://i.imgur.com/rEr5Q3j.png" alt="eslint-test" height="140px">

>shows a linting error in vscode

For running the lint test manually: `meteor npm run lint`

That's it. Up next, [Make a tab!](./make-a-tab.md)
