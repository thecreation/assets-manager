import minimatch from 'minimatch';
import assert from 'assert';
import toRegExp from './toRegExp';
import path from 'path';

export default function(filename, rules) {
  let dirname = path.dirname(filename);
  filename = path.basename(filename);

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
          return path.join(dirname, filename.replace(regex, replacement));
        }

        return path.join(dirname, filename.split(search).join(replacement));
      }

      return path.join(dirname, rules[glob]);
    }
  }

  return path.join(dirname, filename);
}
