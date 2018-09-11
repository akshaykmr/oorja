// need to fix linting in this file. (support dynamic import)
import React from 'react';
import { Edit } from 'imports/ui/components/icons/';

export default {
  1: {
    tabId: 1,

    // Name must be without spaces (used to contain css, check out css for any of the tabs)
    name: 'Info',
    displayName: 'Room Information',

    icon: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-share-2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>,
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
    icon: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-video"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>,
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
    icon: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-file-text"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
    description: 'Shared Richtext document',
    streamContainerSize: '',
    load: () => import('./tabs/QuillPad')
  },
  41: {
    tabId: 41,
    name: 'CodePad',
    displayName: 'CodePad',
    bgColor: '',
    icon: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-code"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>,
    description: 'Shared Code editor',
    streamContainerSize: '',
    load: () => import('./tabs/CodePad')
  },
  42: {
    tabId: 42,
    name: 'Draw',
    displayName: 'Whiteboard',
    bgColor: 'white',
    icon: Edit,
    description: '[Experimental] Whiteboard for drawing and visualizing ideas.',
    streamContainerSize: '',
    load: () => import('./tabs/Draw')
  },
  31: {
    tabId: 31,
    name: 'Chat',
    displayName: 'Chat',
    bgColor: '#faebd7',
    icon: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-message-circle"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>,
    description: 'Chat messaging',
    streamContainerSize: '',
    load: () => import('./tabs/Chat')
  },
  100: {
    tabId: 100,
    name: 'DiscoverTabs',
    displayName: 'Discover Tabs',
    bgColor: '#ffffff',
    icon: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-plus-circle"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>,
    description: 'Discover more tabs',
    streamContainerSize: 'COMPACT',
    load: () => import('./tabs/DiscoverTabs')
  },
  35: {
    tabId: 35,
    name: 'Reacteroids',
    displayName: 'Reacteroids',
    bgColor: '#ffffff',
    icon: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-target"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>,
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
    icon: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-git-pull-request"><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M13 6h3a2 2 0 0 1 2 2v7"></path><line x1="6" y1="9" x2="6" y2="21"></line></svg>,
    description: 'For developers: A blank slate tab to be used as boilerplate for developing new tabs',
    streamContainerSize: 'COMPACT',
    local: false,
    load: () => import('./tabs/BlankSlate')
  },

  // add your tab details here !
};
