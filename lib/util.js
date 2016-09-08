'use strict';

const util = {
  parseOptions(data, base = 'dest') {
    let keys = Object.keys(data);
    let obj = {};

    let re = new RegExp(`^${base}:(.+)$`);
    keys.filter(function(key){
      if(re.test(key)){
        return true;
      }
      return false;
    }).forEach((key)=>{
      let oriKey = key.replace(re, '$1');

      obj[oriKey] = data[key];
    });

    return obj;
  }
}
export default util;
