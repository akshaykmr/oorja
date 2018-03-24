// TODO: Unit test
class ActivityListener {
  constructor(activities) { // Activity Types must be registered initially
    this.listnerStore = {}; // ActivityType -> [handlerFunction, ...]
    Object.keys(activities).forEach((activity) => {
      this.listnerStore[activity] = [];
    });

    this.listen = this.listen.bind(this);
    this.dispatch = this.dispatch.bind(this);
  }

  checkIfValidActivity(activity) {
    if (!(activity in this.listnerStore)) {
      throw new Error(`activity not found: ${activity}`);
    }
  }

  listen(activity, listner) {
    this.checkIfValidActivity(activity);
    this.listnerStore[activity].push(listner);
  }

  dispatch(activity, activityDetail) {
    this.checkIfValidActivity(activity);
    this.listnerStore[activity].forEach((listner) => {
      listner(activityDetail);
    });
  }

  remove(activity, listner) {
    this.checkIfValidActivity(activity);
    console.warn('TODO');
    this.listnerStore[activity] = this.listnerStore[activity]
      .filter(activityListener => activityListener !== listner);
  }
}

export default ActivityListener;
