'use strict';

const log = {
  info: function() {
    console.log.apply(console, Array.prototype.slice.call(arguments));
  }
}
export default log;
