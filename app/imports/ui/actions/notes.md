# localStorage
  Only touch localStorage in actions

  keys: 
    - 'roomSecret:$roomName' ->  // room auth | contains a secret
    - 'roomToken:$roomName' // erizoToken
    - 'roomUserId:$roomName' // the userId used to join the room

    // remeber to delete the room tokens when user logs out/ exits the room


update github callback url 
setup app descriptions and logos in oauth for all services.

notes
removed "typeof module" from erizo and modified  "getBrowser"