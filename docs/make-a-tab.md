# Making a Tab
Awesome! you made it this far.
Making tab is quite easy and fun. You only need to know some react and have some imagination. If you haven't used react before just try out their tutorial and continue here.


### How are tabs loaded
Lets have a look at the Room below, and narrow down to the tab components.

<p align="center">
  <img src="http://imgur.com/mV0IyiC.png" alt="" height="500px">

  The Room contains two major areas:
  1. Streams container: ( Red Box ) shows the connected users and their video streams if any. Here you can see user Akshay connected with avatar `AK`
  2. Spotlight: ( Yellow box ) It houses all the tabs in the room and with controls to switch between them. Each tab has a badge, shown on the left, and the actual tab content as shown.
    <p align="center">
      <img src="http://imgur.com/wadJCIB.png" alt="" height="500px">
    </p>
  Now open your editor and navigate to `app/imports/ui/components/room/Spotlight`.
In this directory you can see all the tabs and their code. Each of them exports react component. The spotlight component loads the desired tabs (dynamically if need be) and renders their content on top of each other in the red box area marked as `tab content`. Depending on which tab is in focus (or active as in code), the z-index property is changed to bring it `onTop`.
Writing only a tab component is not enough, it needs to be registered in the app. For this checkout `tabRegistry.js` which registers the tab and specifies its icon, description and other details described in that file.

For boilerplate or quickly testing something, use the already made tab `BlankSlate` you can start off immediately by tinkering with this minimal registered tab.

</p>

### Props and RoomAPI

Now that we know how tabs are rendered lets see what we can do with them.
The idea is simple, using the provided props and event listners to your tab component add a simple functionality to the room.
The props passed to your tab are in `tabPropTypes.js`. Below I will try to describe each props purpose. It may not be immediately clear how they are used so I will try and give an examples from where its been used and why.



