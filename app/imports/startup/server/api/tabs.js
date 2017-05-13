export default [
  // upsert contents to DB when this file gets big.
  {
    tabId: 1,

    // must be without spaces (why? used to contain css, check out css for any of the tabs)
    name: 'Info',
    displayName: 'Room Information',
  // icons are currently from ionic, maybe allow images or svgs later
  // iconColor is for the tabSwitch when I was experimenting with them,
  // but later on I stuck with a set color scheme instead of a custom one for each tab.
    icon: 'android-share-alt',
    iconColor: '#fffad5',

    // bgColor is the background color for the tab content
    bgColor: '#ffffff',

    description: 'Invite others to this room',

    // specify custom streamContainer size for this tab
    // '' means auto (if there is any video stream [MEDIUM] else [COMPACT]),
    //  else specify one of [COMPACT, MEDIUM]. CSS for LARGE is not working well atm.
    streamContainerSize: '',
  },
  {
    tabId: 10,
    name: 'VideoChat',
    displayName: 'Video chat',
    iconColor: '#fffad5',
    bgColor: '#2e3136',
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
  {
    tabId: 40,
    name: 'QuillPad',
    displayName: 'QuillPad',
    iconColor: '#fff0a5',
    bgColor: '#ffffff',
    icon: 'document-text',
    description: 'Shared Richtext document',
    streamContainerSize: '',
  },
  {
    tabId: 41,
    name: 'CodePad',
    displayName: 'CodePad',
    iconColor: 'turquoise',
    bgColor: '',
    icon: 'code-working',
    description: 'Shared Code editor',
    streamContainerSize: '',
  },
  {
    tabId: 31,
    name: 'Chat',
    displayName: 'Chat',
    iconColor: '#9ac16e',
    bgColor: '#faebd7',
    icon: 'chatbubbles',
    description: 'Chat messaging',
    streamContainerSize: '',
  },
  {
    tabId: 100,
    name: 'DiscoverTabs',
    displayName: 'Discover Tabs',
    iconColor: '#7dd3f5',
    bgColor: '#ffffff',
    icon: 'ios-plus',
    description: 'Discover more tabs',
    streamContainerSize: 'COMPACT',
  },
  {
    tabId: 35,
    name: 'Reacteroids',
    displayName: 'Reacteroids',
    iconColor: '#7dd3f5',
    bgColor: '#ffffff',
    icon: 'planet',
    description: 'Play a game while you wait',
    streamContainerSize: 'COMPACT',
  },
];
