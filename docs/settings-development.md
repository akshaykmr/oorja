##### settings-development.json

Below is a brief description of settings found in the config file.
I will use comments for explanation alongside each value, but remember that this is not valid json and do not try to copy it for use.

```
{
  "public": { // public settings are available for use on the client


    // chrome extension Id for screensharing
    "screenShareExtensionId": "kobkjhijljmjkobadoknmhakgfpkhiff",

    // bandwidth settings for video streams
    "defaultMaxVideoBW": 300,
    "defaultMaxAudioBW": 300,

    // Whether to refresh the webpage when waking up from sleep.
    // recommended disabled for development and debugging.
    "refreshOnWake": false
  },

  "private": { // settings only available on the server
               // use them for apikeys etc.

    "roomConfig": { // deprecated
      "defaultComms": "video"
    },

    "JWTsecret": "super-secret", // jwt secret string
    "JWTalgo": "HS512",          // jwt algo
    "tokenVersion": 1,           // token version, used to reject previously
                                 // issued tokens if changed.
    "saltRounds": 11,            // salt rounds for hashed password
    "enableBugsnag": false,      // error logging, not implemented properly yet 
    "bugsnagKey": "123",         // key

    "Nuve": {
      "serviceName": "ss1",      // just a name for identifying nuve service
      "serviceId": "1",          // service Id from licode_config.js
      "serviceKey": "2",         // service key
      "host": "https://10.20.23.14:3000/" // host address for nuve
    },

    // see: https://github.com/cult-of-coders/redis-oplog
    "redisOplog": {
      "redis": {
        "port": 6379,
        "host": "127.0.0.1"
      },
      "mutationDefaults": {
        "optimistic": false,
        "pushToRedis": true
      },
      "debug": true,
      "overridePublishFunction": true
    },

    // below are appId and secret pairs for OAuth for various services
    // you need to make you own appId from their interface and substitute
    // them here. Not mandatory as you can simply join the room anonymously.
    
    "github": {
      "clientId": "id",
      "secret": "secret"
    },

    "google": {
      "clientId": "id",
      "secret": "secret"
    },

    "facebook": {
      "clientId": "id",
      "secret": "secret"
    },

    "twitter": {
      "consumerKey": "id",
      "secret": "secret"
    },
    "linkedin": {
      "clientId": "id",
      "secret": "secret"
    },

    "reddit": {
      "clientId": "id",
      "secret": "secret"
    },

    "twitch": {
      "clientId": "id",
      "secret": "secret"
    },

    "weibo": {
      "clientId": "",
      "secret": ""
    }
  }
}
```
