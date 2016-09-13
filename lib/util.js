'use strict';

const util = {
  extendVal(first, second) {
    if(typeof second === 'undefined') {
      return first;
    }
    return second;
  },

  parseOptions(data, base = 'dest') {
    let keys = Object.keys(data);
    let obj = {};

    let re = new RegExp(`^${base}:(.+)$`);
    keys.filter(function(key){
      if(re.test(key)){
        return true;
      }
      return false;
    }).forEach(key => {
      let oriKey = key.replace(re, '$1');

      obj[oriKey] = data[key];
    });

    return obj;
  }
}
export default util;
