'use strict';
import minimatch from 'minimatch';
import assert from 'assert';

export default function(filename, rules) {
  for(let glob in rules) {
    if(minimatch(filename, glob)) {
      if(Array.isArray(rules[glob])){
        let regex = rules[glob][0];

        if(typeof regex === 'string') {
          regex = new RegExp(regex);
        }
        assert(
          regex instanceof RegExp,
          `The first params of ${glob} should be regexp`
        );
        assert(
          typeof rules[glob][1] === 'string',
          `The second params of ${glob} should be string`
        );
        return filename.replace(regex, rules[glob][1]);
      } else {
        return rules[glob];
      }
    }
  }

  return filename;
}
