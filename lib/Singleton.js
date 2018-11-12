const instance = Symbol('instance');

export default class Singleton {
  static get instance() {
    if (!this[instance]) {
      this[instance] = new this();
    }

    return this[instance];
  }

  constructor() {
    const Class = this.constructor;

    if (!Class[instance]) {
      Class[instance] = this;
    }

    return Class[instance];
  }
}
