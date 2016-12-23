# localStorage
  Only touch localStorage in actions

  keys: 
    - 'roomToken:$roomName' -> roomShareToken // room auth
    - 'roomShareToken:$roomShareToken' -> roomShareToken  // store code for shareable link;