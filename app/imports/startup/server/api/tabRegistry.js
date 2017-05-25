export default {
  // upsert contents to DB when this file gets big.
  1: {
    tabId: 1,
    // must be without spaces (used to contain css, check out css for any of the tabs)
    name: 'Info',
    displayName: 'Room Information',
    // icons are currently from ionic, maybe allow images or svgs later
    // iconColor is for the tabSwitch when I was experimenting with them,
    // but later on I stuck with a set color scheme instead of a custom one for each tab.
    icon: 'android-share-alt',
    // bgColor is the background color for the tab content
    bgColor: '#ffffff',
    description: 'Invite others to this room',


    // by default if someone adds a tab in the room. it will be loaded for all
    // participants of the room. however if local is true then adding it won't load
    // it for others. e.g used in Reacteroids(game) tab.
    local: false,


    // specify custom streamContainer size for this tab
    // '' means auto (if there is any video stream [MEDIUM] else [COMPACT]),
    //  else specify one of [COMPACT, MEDIUM]. CSS for LARGE is not working well atm.
    streamContainerSize: '',
  },
  10: {
    tabId: 10,
    name: 'VideoChat',
    displayName: 'Video chat',
    bgColor: '#25272a',
    icon: 'videocamera',
    description: 'Video chat',
    streamContainerSize: '',

  },
  // {
  //   tabId: 30,
  //   name: 'Settings',
  //   displayName: 'Settings',
  //   iconColor: '#acf0f2',
  //   ContentBgColor: '',
  //   bgColor: '',
  //   icon: 'ios-settings',
  //   description: 'Configure your webcam and Room settings',
  //   streamContainerSize: '',
  // },
  40: {
    tabId: 40,
    name: 'QuillPad',
    displayName: 'QuillPad',
    bgColor: '#ffffff',
    icon: 'document-text',
    description: 'Shared Richtext document',
    streamContainerSize: '',

  },
  41: {
    tabId: 41,
    name: 'CodePad',
    displayName: 'CodePad',
    bgColor: '',
    icon: 'code-working',
    description: 'Shared Code editor',
    streamContainerSize: '',

  },
  31: {
    tabId: 31,
    name: 'Chat',
    displayName: 'Chat',
    bgColor: '#faebd7',
    icon: 'chatbubbles',
    description: 'Chat messaging',
    streamContainerSize: '',

  },
  100: {
    tabId: 100,
    name: 'DiscoverTabs',
    displayName: 'Discover Tabs',
    bgColor: '#ffffff',
    icon: 'ios-plus',
    description: 'Discover more tabs',
    streamContainerSize: 'COMPACT',

  },
  35: {
    tabId: 35,
    name: 'Reacteroids',
    displayName: 'Reacteroids',
    bgColor: '#ffffff',
    icon: 'planet',
    description: 'Play a game while you wait',
    streamContainerSize: 'COMPACT',
    local: true,

  },
};
