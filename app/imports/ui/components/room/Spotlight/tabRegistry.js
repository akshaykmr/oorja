// need to fix linting in this file. (support dynamic import)



export default {
  1: {
    tabId: 1,

    // Name must be without spaces (used to contain css, check out css for any of the tabs)
    name: 'Info',
    displayName: 'Room Information',

    icon: 'android-share-alt',
    description: 'Invite others to this room',

    // Baground color for the div containing your tab content
    bgColor: '#ffffff',

    // by default if someone adds a tab in the room. it will be loaded for all
    // participants of the room. however if local is true then adding it won't load
    // it for others. e.g used in Reacteroids(game) tab.
    local: false,

    // specify custom streamContainer size for this tab
    // '' means auto (if there is any video stream [MEDIUM] else [COMPACT]),
    //  else specify one of [COMPACT, MEDIUM]. CSS for LARGE is not working well atm.
    streamContainerSize: '',

    // Rather than specifying just the import path. It needs to be a function because
    // Dynamic imports must be statically anlyzable. And thus I can't use strings determined
    // on runtime to load these components elsewhere.
    load: () => import('./tabs/Info'),
  },
  10: {
    tabId: 10,
    name: 'VideoChat',
    displayName: 'Video chat',
    bgColor: '#25272a',
    icon: 'videocamera',
    description: 'Video chat',
    streamContainerSize: '',
    load: () => import('./tabs/VideoChat'),
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
    load: () => import('./tabs/QuillPad')
  },
  41: {
    tabId: 41,
    name: 'CodePad',
    displayName: 'CodePad',
    bgColor: '',
    icon: 'code-working',
    description: 'Shared Code editor',
    streamContainerSize: '',
    load: () => import('./tabs/CodePad')
  },
  31: {
    tabId: 31,
    name: 'Chat',
    displayName: 'Chat',
    bgColor: '#faebd7',
    icon: 'chatbubbles',
    description: 'Chat messaging',
    streamContainerSize: '',
    load: () => import('./tabs/Chat')
  },
  100: {
    tabId: 100,
    name: 'DiscoverTabs',
    displayName: 'Discover Tabs',
    bgColor: '#ffffff',
    icon: 'ios-plus',
    description: 'Discover more tabs',
    streamContainerSize: 'COMPACT',
    load: () => import('./tabs/DiscoverTabs')
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
    load: () => import('./tabs/Reacteroids')
  },
  999: {
    tabId: 999,
    name: 'BlankSlate',
    displayName: 'Blank Slate',
    bgColor: '#ffffff',
    icon: 'lightbulb',
    description: 'For developers: A blank slate tab to be used as boilerplate for developing new tabs',
    streamContainerSize: 'COMPACT',
    local: false,
    load: () => import('./tabs/BlankSlate')
  },

  // add your tab details here !
};
