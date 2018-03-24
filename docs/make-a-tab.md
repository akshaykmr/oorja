# Making a Tab
Awesome! you made it this far.
Making tab is quite easy and fun. You only need to know some react and have some imagination. If you haven't used react before just try out their tutorial and continue here.


### How are tabs loaded
Lets have a look at the Room below, and narrow down to the tab components.

<p align="center">
  <img src="http://imgur.com/mV0IyiC.png" alt="" height="500px">

  The Room contains two major areas:
  1. Streams container: ( Red Box ) shows the connected users and their video streams if any. Here you can see user Akshay connected and the UI showing avatar with `AK` initials.
  2. Spotlight: ( Yellow box ) It houses all the tabs in the room and with controls to switch between them. Each tab has a badge, shown on the left, and the actual tab content as shown.
    <p align="center">
      <img src="http://imgur.com/wadJCIB.png" alt="" height="500px">
    </p>
  Now open your editor and navigate to `app/imports/ui/components/Room/Spotlight`.
In this directory you can see all the tabs and their code. Each of them exports react component. The spotlight component loads the desired tabs (dynamically if need be) and renders their content on top of each other in the red box area marked as `tab content`. Depending on which tab is in focus (or active as in code), the z-index property is changed to bring it `onTop`.
Writing only a tab component is not enough, it needs to be registered in the app. For this checkout `tabRegistry.js` which registers the tab and specifies its icon, description and other details described in that file.

For boilerplate or quickly testing something, use the already made tab `BlankSlate` you can start off immediately by tinkering with this minimal registered tab.

</p>

### Props and RoomAPI

Now that we know how tabs are rendered lets see what we can do with them.
The idea is simple, using the provided props and event listeners to your tab component add a simple functionality to the room.

##### Tab badge
I should introduce the badge first. Each tab has a badge that can be used for some minimal content and added ux. This is not a part of the tab component just some content that can be changed by calling a prop function in your tab (in this case `updateBadge`). For example the following picture shows unread message count in chat tab  and new content in code-editor tab when they are not in focus.

<img src="http://imgur.com/dZEEkGO.png" alt="badge example" height="160px">

The props passed to your tab are in `tabPropTypes.js`. Below I will try to describe each props purpose. It may not be immediately clear how they are used so I will try and give an examples from where its been used and why. Though it would be best to read the code of existing tabs. 
Use the React developer tools extension to browse these props in detail.

  - **roomInfo**: Contains room info such as name, participants, tabs etc.
  - **connectedUsers**: The roomInfo object shows all users that have access to the room but this list shows the currently connected ones along with their active session list.
  - **roomReady**: A boolean, whether or not room is connected.
  - **onTop**: bool, whether this tab is currently `onTop` or the current active tab. eg. If the tab is not currently on top you may want to stop unnecessary rendering or animation since its not visible to the user.
  - **primaryMediaStreamState**: The primary media stream is webcams audio/video stream. This object describes its state. eg. used by video chat tab to toggle mic/video when respective control buttons are clicked.
  - **screenSharingStreamState**: The stream state for the screen sharing stream.
  - **uiSize**: You will find some constants used throughout the code base most of these are in `/Room/constants/` they are their to avoid magic strings in the code. uiSize value is one of these constants found in `/Room/constants/uiConfig.js` uiSize is used to determine whether the ui is compact or large. eg. used to position Arrow in in Room Info tab.
  - **classNames** and **style**: each tab component applies these props to their main div for proper positioning and styling, yours must as well. If you see any of the tabs its main render block contains code like this: 
  ``` jsx
  <div className={this.props.classNames} style={this.props.style}>
    content goes here
  </div>
 ```
 There is something more to notice here as well. Your main div receives some classes namely `.onTop` if on top, `.compact` if UI is compact, `.$tabName` your tab name. Using these classes you can apply appropriate css rules for these conditions easily (check out any other tabs scss file). the `$tabName` is used to contain your tabs css rules.
 ``` scss
    .myTab {
      .containedRule {
       // will not affect other tabs
      }
      &.compact {
        // ui is compact apply appropriate css rules
      }
    }
 ``` 
<p align="center">
example of using uiSize and added css rules:

<img src="http://imgur.com/8TyopNG.png" alt="" height="400px"> <img src="http://imgur.com/vejg67C.png" alt="" height="400px">
</p>

  - **setTabReady**: Tabs can be dynamically added to the room. before messaging can take place a tab must mark itself ready so that it can be discovered by others(tabs, local or remote) in the room. To be only called once. Used in collaborative tabs such as codepad, chat etc. Kind of wonky at the moment.
  - **switchToTab(tabId)**: switches to the tab with given id. eg. Video Chat tab uses a click handler for *inviting users to the room* and switches to Room Info tab where user can copy the room link. Also Discover tab also switches to newly loaded tab when its added.
  - **addTabToRoom(tabId)**: used to add a tab to the room. If the tab is not `local` then its loaded for all room participants. Used in Discover tab to dynamically add tabs to the room.
  - **tabStatusRegistry**: information of other tabs in the room and their state[initializing, loading, loaded ].
  - **roomAPI**: An object to interact with the room. properties are described below
    + getUserId(): gives own userId
    + getSession(): gives own sessionId. **minor detour** - A user can have multiple sessions active thus sessionId identifies the unique user. This is purely for ux reasons and has some effects on activityListeners which will be described shortly.
    + getUserInfo(userId): gives user information for the given userId 
    + getActiveRemoteTabs(sessionId): gives the list of remote tabs set as ready by sessionId(unique user session)
    + shareScreen(): start screen sharing
    + stopScreenShare(): stop screen sharing
    + mutePrimaryMediaStreamVideo()
    + unmutePrimaryMediaStreamVideo()
    + mutePrimaryMediaStreamAudio()
    + unmutePrimaryMediaStreamAudio()
    + togglePrimaryMediaStreamAudio()
    + togglePrimaryMediaStreamVideo()
    + initializePrimaryMediaStream(): initialize webcam/audio stream.
    + **sendMessage(message)**: each tab can send and receive json serializable messages. To see the message format see `Messenger.js`. With this you can send messages to any tabs local or remote(loaded by another room participant). In the message you need to specify the recipient users, and the recipient tabs. When a message is received the handler registered by the recipient tab will be called with the message contents.
    + **addMessageHandler(tabId, handler)**: The tab must register a message handler to process messages. Use the message handler to change state, trigger actions in your tab etc. just search the project for `roomAPI.addMessageHandler` for use cases. 
    + removeMessageHandler(tabId, handler): removes previously registered handler.
    + **addActivityListener(activityName, listener)**: add listeners for various events happening in the room. check out `roomActivities.js` for list of roomActivities. eg. `roomAPI.addActivityListener(roomActivities.TAB_SWITCH, myfunction);` List of room activities is given below. Their payload can be found in `roomActivities.js` (the payload is the data passed to your handler and contains details of the activity)
        * ROOM_CONNECTED
        * ROOM_DISCONNECTED
        * ROOM_ERROR
        * USER_JOINED
        * USER_LEFT
        * USER_SESSION_ADDED: another session of the user has become active. different device or maybe a new browser tab.
        * USER_SESSION_REMOVED
        * REMOTE_TAB_READY: a remote tab is now ready for receiving messages.
        * STREAM_SPEAKING_START: indicates start of speech in media stream. eg. used in videoChat tab to focus the current speaker.
        * STREAM_SPEAKING_END
        * STREAM_CLICKED: a click registered on the stream in the top stream container. eg. used by videoChat tab to temporarily pin the clicked stream into focus.
        * USER_CLICKED: user avatar clicked in streams container. not used anywhere as of yet. There for added interactivity in future work. eg. consider a step which involves selecting a user in your tab, clicking on his avatar in the above stream container would be quite easy.
        * TAB_SWITCH: indicates a switch between tabs. payload contains previous tab and the newly active tab.
  - **touchDevice**: boolean to check if the device is a touch enabled.
  - **updateBadge(options)**: A function to set contents of the badge or toggle its visibility. 
  - **tabInfo**: Gives own tab information, badge information.

  eg. `TAB_SWITCH` event in the room gives the tabId of the previous tab and the newly active tab. tabInfo.tabId in the event listener of CodePad tab to focus the editor if its on top (and ignore if the device is touch enabled).
  It also clears the badge contents when tab is focussed.

  ``` jsx
        roomAPI.addActivityListener(roomActivities.TAB_SWITCH, (payload) => {
        if (payload.to === tabInfo.tabId) {
          if (!this.props.touchDevice) editor.focus();

          if (this.props.tabInfo.badge.visible) {
            this.props.updateBadge({
              visible: false,
            });
          }
        }
      });
 ```

Over time more examples from existing tabs will be added alongside each prop or roomAPI, although after reading this you should be able to tackle how existing tabs work and make your own.

#### Handling shared editing on structured data
Since no data stored on the server for tabs (such as chat, or codePad etc.) you might be wondering how syncing of data works. oorja uses [yjs](http://y-js.org/) for this purpose with a custom connector. You might want to make use of it in your tabs. See code for Chat, quillpad, code pad to see how it's been used. tab idea: make a shared drawing area using canvas and yjs.


#### Regarding messaging
For properly receiving/sending messages you need to take care that the recipient remote tab is ready. When initializing your tab iterate through `connectedUsers` and their `sessions`, get the list of their active tabs through `getActiveRemoteTabs(sessionId)` then *connect* them in your logic if they are ready. For tabs that get loaded later, listen for `roomActivities.REMOTE_TAB_READY` and *connect* accordingly. Also do not forget to call `tabReady` after the setup to indicate that your tab is now ready.

For sending messages a licode data stream is used by each participant. However I found out later that it is not p2p and uses erizoController(a socket.io server) instead for delivering messages. So it is advisable to use it judiciously, in future an RTCDataChannel will be established between peers for streaming data transfer.


#### Some additional props
Some additional props are also available by connecting your component to the redux store
- mediaStreams(a collection of audio video streams and their state)
- streamSpeaking (whether a stream with given streamId is speaking) eg. used in streams container to add a glowing bottom border for video or a glowing border around the avatar for muted video.

see videoChat tab to see how these props are connected.

#### Reuse existing components
Reuse existing components in the app, some of them are listed below

- **Avatar**: renders a circular avatar of users display picture from social login or initials of his/her name if not available. Just pass the users information to this component. eg. used in chat tab to render avatar alongside chat bubbles.
<p align="center">
<img src="http://imgur.com/ekh3go8.png" alt="" height="240px">
</p>

- **Sidebar**: a drawer for additional content. Pass it the component that needs to be rendered in the sidebar with some additional info. eg. used in CodePad tab for changing editor settings(theme, syntax)

<p align="center">
<img src="http://imgur.com/dDi2qRR.png" alt="" height="500px">
</p>

- **Spinner**: a spinning logo for oorja. displayed in chat, codepad, quillpad when syncing initial data between peers

- **[Blueprint components](http://blueprintjs.com/)**: A collection of React UI components that cover the majority of the common interface elements, patterns, and interactions on the web. Its already included, just import and use it.


#### Other thoughts
I'd recommend reading the code of existing tabs to have better understanding. Also, the props and roomAPI are not rigid, they are merely information and actions that I thought could be utilized by other tabs as well. If you feel some pattern(esp. for messaging) or utility could be helpful for other tabs as well, you are welcome to propose the additions or changes.

#### What to make?
Well remember the tab component is just a blank slate you can make anything possible in the web browser to render in it (you may use canvas, http calls to external api's etc.) The room api and props are just there for the tab to interact with the room if need be.
If you wish to make external api calls use [the http module](https://docs.meteor.com/api/http.html). 
A tab may be local as well as specified in `tabRegistry.js`, when local it is only loaded locally for the user that adds it to the room. eg. Reacteroids game tab must be added individually by users choice. It doesn't use messaging at all and is just a simple game.
Design the tab well and keep it minimal. Personally I've got 2 tabs on my mind right now. one is a settings tab for configuring webcam, room etc. the other is a helpcenter which will keep help articles for reference(each tab will be able to register its own articles and switch to them with a function call).

That's it for now. Go give it a spin.