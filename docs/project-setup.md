# Project setup
This document will describe how to get the project running. I would recommend a *nix machine (ubuntu/mac) for all development purposes and my instructions will cater to them.
In brief you would be
 - installing the meteor tool if you do not have it
 - installing the node module dependencies
 - setting up a licode instance
 - filling the development settings in `settings-development.json`
 - phew! running the App! 🙏

### File structure

`/app` contains the meteor app.
The **application strucure** of the project in `/app` is similar to one described in [these docs](https://guide.meteor.com/structure.html#javascript-structure). All the code stays in this directory.
All the commands to run the project etc. are to be executed in this directory.

`/build` output directory for the built application. Its contents are ignored in git.

`/chrome-extension` is the unpacked chrome extension used for screen sharing.

`/docs` contains documentation.

## Lets get started

#### setting up the web app

- `cd /app`
- [install the meteor tool](https://www.meteor.com/install)
- install the node dependencies `meteor npm install`
- Now in order to configure the environment settings for the application a file called `settings-development.json` is needed. A sample file called `settings-example.json` is provided. simply copy it's contents into a new file named `settings-development.json` in the same directory.  We will fill in it's contents later.
- Try running the app. `meteor npm start` This should start the development server at `localhost:3000`. Do not try using the app though as we still need to setup licode and configure it's settings in `settings-development.json`

#### setting up licode

You can install licode with [docker](http://licode.readthedocs.io/en/master/docker/) or [build it from source](http://licode.readthedocs.io/en/master/from_source/). It may take some time for you to set this up but remember you only need to do it once.

Personally, I built it from source. I would recommend that you install licode on a cheap vps from aws/gce/digital-ocean etc. That way you can test the app on different devices amoung other advantages. Once you have setup licode, keep it running there using tmux or some other tool.

Once you have setup licode, run it in the background. Now you will need to put in the configuration settings in `settings-development.json`

```
    "Nuve": {
      "serviceName": "any-name",  // just a name for your nuve service
      "serviceId": "1",           // from from licode_config.js
      "serviceKey": "2",          // from from licode_config.js 
      "host": "https://10.20.23.14/"  // host address of your nuve server
    },
```
do not put any comments in config file (it's not valid json)

VPS Gotchas:
- Remember to allow relevant ports through firewall. eg. 3000(nuve), 8080(erizoController) and some more if you use Erizo for forwarding streams.
- you need to manually specify the public ip in `licode_config.js` when set to auto, it picks up the ip of the vps's private network instead of public ip.
- Recommended: setup a reverse proxy (for nuve and erizoController) with ssl termination on the licode server. It's best to have the app served over https and all its outgoing connections over https since camera and media device permissions will likely be denied by the browser otherwise (does work on localhost though).


#### Run the app
- With all settings in place the app should be able to run 🙏. `meteor npm start` Don't worry if some error comes up (I am expecting it), reach out to me and I'll try to update the docs accordingly.

[**more details on settings-development.json**](./settings-development.md)