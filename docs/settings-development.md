##### settings-development.json

Below is a brief description of settings found in the config file.
I will use comments for explanation alongside each value, but remember that this is not valid json and do not try to copy it for use.

```
{
  "public": {
    // chrome extension id for screensharing
    // only works over https
    "screenShareExtensionId": "abc",

    // licode related stream config
    "defaultMaxVideoBW": 300,
    "defaultMaxAudioBW": 300,

    // refresh the browser if waking from sleep.
    "refreshOnWake": false,

    // cdn url for javascript bundle
    "cdnURL": "https://d21e9wyielwbyq.cloudfront.net",

    // beam micorservice location
    "beamConfig": {
      "socketProtocolPrefix": "ws://",   # "wss://" in production
      "httpProtocolPrefix": "http://",   
      "host": "127.0.0.1:5000"
    }
  },
  "private": {

    "JWTsecret": "super-secret",
    "JWTalgo": "HS512",

    // salt rounds for password hashing
    "saltRounds": 11,

    "enableBugsnag": false,
    "bugsnagKey": "",

    // credentials for interacting with licode
    "Nuve": {
      "serviceName": "ss1",
      "serviceId": "5a890e9e17e75122514b0a41",
      "serviceKey": "25694",
      "host": "http://localhost:3010/"
    },

    // used for authorizing internal backend calls. This value and the once in
    // beam microservice must match.
    "privateAPISecret": "abcd",

    "github": {
      "clientId": "",
      "secret": ""
    },

    "google": {
      "clientId": "",
      "secret": ""
    },

    "facebook": {
      "clientId": "",
      "secret": ""
    },

    "twitter": {
      "consumerKey": "",
      "secret": ""
    },
    "linkedin": {
      "clientId": "",
      "secret": ""
    },

    "reddit": {
      "clientId": "",
      "secret": ""
    },

    "twitch": {
      "clientId": "",
      "secret": ""
    },

    "weibo": {
      "clientId": "",
      "secret": ""
    }
  }
}
```
