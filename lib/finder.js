'use strict';

import globby from 'globby';
import defaultTypes from './types';
import minimatch from 'minimatch';
import extend from 'deep-extend';

/**
 * Finder
 */
class Finder {
  classifyFiles(dir, types = defaultTypes, options = {}) {
    let result = {};

    for (let type of Object.keys(types)) {
      if (Array.isArray(dir)) {
        options = extend({
          matchBase: true
        }, options);
        result[type] = dir.filter(minimatch.filter(types[type], options));
      } else {
        result[type] = this.filterFilesByType(dir, type, types, options);
      }
    }

    return result;
  }

  listFiles(dir, options = {}) {
    options = extend({
      dot: true,
      ignore: ['.*', 'bower_components', 'node_modules']
    }, options);

    return this.filterFiles(dir, '**/*', options);
  }

  filterFiles(dir, filter, options = {}) {
    options = Object.assign({
      cwd: dir,
      nodir: true
    }, options);

    return globby.sync(filter, options);
  }

  filterFilesByType(dir, type, types = defaultTypes, options = {}) {
    options = extend({
      matchBase: true
    }, options);

    return this.filterFiles(dir, types[type], options);
  }
}

const finder = new Finder();
export default finder;
