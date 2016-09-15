'use strict';
import minimatch from 'minimatch';
import assert from 'assert';
import toRegExp from './toRegExp';

export default function(filename, rules) {
  for(let glob in rules) {
    if(minimatch(filename, glob)) {
      if(Array.isArray(rules[glob])){
        let search = rules[glob][0];
        let replacement = rules[glob][1];

        assert(
          typeof replacement === 'string',
          `The second params of ${glob} should be string`
        );

        let regex = toRegExp(search);
        if(regex) {
          return filename.replace(regex, replacement);
        }

        return filename.split(search).join(replacement);
      }

      return rules[glob];
    }
  }

  return filename;
}
