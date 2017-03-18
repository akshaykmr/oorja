// be sure to bind the listners with context(this) before attaching them.
class ActivityListner {
  constructor(activities) {
    this.listnerStore = {}; // ActivityType -> [handlerFunction, ...]
    Object.keys(activities).forEach((activity) => {
      this.listnerStore[activity] = [];
    });
  }

  listen(activity, listner) {
    if (!(activity in this.listnerStore)) {
      console.error('activity not found', activity);
      return;
    }
    this.listnerStore[activity].push(listner);
  }

  dispatch(activity, activityDetail) {
    this.listnerStore[activity].forEach((listner) => {
      listner(activityDetail);
    });
  }
}

export default ActivityListner;
