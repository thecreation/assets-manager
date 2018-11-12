import Singleton from './Singleton';
import dotProp from 'dot-prop';

/* It get inspriation from yeoman/configstore */
class Configure extends Singleton {
  constructor() {
    super();
    this.values = {};
  }

  get(key, defaultValue) {
    if (this.has(key)) {
      return dotProp.get(this.values, key);
    }
    return defaultValue;
  }

  set(key, val) {
    let values = this.values;
    if (arguments.length === 1) {
      Object.keys(key).forEach(function (k) {
        dotProp.set(this.values, k, key[k]);
      }.bind(this));
    } else {
      dotProp.set(this.values, key, val);
    }
    this.values = values;
  }

  has(key) {
    return dotProp.has(this.values, key);
  }

  delete(key) {
    let values = this.values;
    dotProp.delete(values, key);
    this.values = values;
  }

  all(values) {
    if (typeof values === 'object') {
      this.values = values;
    } else {
      return this.values;
    }
  }

  size() {
    return Object.keys(this.values).length;
  }

  clear() {
    this.values = {};
    return true;
  }
}

let configure = new Configure();
export default configure;
