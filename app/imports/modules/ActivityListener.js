class ActivityListener {
  constructor(activities) {
    this.listnerStore = {}; // ActivityType -> [handlerFunction, ...]
    Object.keys(activities).forEach((activity) => {
      this.listnerStore[activity] = [];
    });

    this.listen = this.listen.bind(this);
    this.dispatch = this.dispatch.bind(this);
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

export default ActivityListener;
