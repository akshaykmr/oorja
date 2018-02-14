/* global window */
class Storage {
  constructor(identifier) { // :string - eg. objectnamespace:id etc.
    this.id = String(identifier);
  }

  get() {
    const serialized = window.localStorage.getItem(this.id);
    if (!serialized) return null;
    return JSON.parse(serialized);
  }

  save(item) {
    window.localStorage.setItem(this.id, JSON.stringify(item));
    return this;
  }

  clear() {
    window.localStorage.removeItem(this.id);
    return this;
  }

  getKey(key, fallback) {
    const item = this.get() || {};
    return item[key] || fallback;
  }

  setKey(key, val) {
    const item = this.get() || {};
    item[key] = val;
    this.save(item);
    return this;
  }

  setKeys(map) {
    const item = this.get() || {};
    this.save({ ...item, ...map });
    return this;
  }

  deleteKey(key) {
    const item = this.get();
    if (!item) return this;
    delete item[key];
    this.save(item);
    return this;
  }

  deleteKeys(keyList) {
    const item = this.get();
    if (!item) return this;
    keyList.forEach(key => delete item[key]);
    this.save(item);
    return this;
  }
}

export default Storage;
