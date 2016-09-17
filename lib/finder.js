'use strict';

import globby from 'globby';
import defaultTypes from './types';
import minimatch from 'minimatch';
import extend from 'deep-extend';

/**
 * Finder
 */
class Finder {
  classifyFilesFromGlobs(dir, globs, types = defaultTypes, options = {}) {
    let result = {};

    let files = this.listFiles(dir, globs, options);

    for (let type of Object.keys(types)) {
      options = extend({
        matchBase: true
      }, options);
      result[type] = files.filter(minimatch.filter(types[type], options));
    }

    return result;
  }

  classifyFilesFromDir(dir, types = defaultTypes, options = {}) {
    let result = {};

    for (let type of Object.keys(types)) {
      result[type] = this.filterFilesByType(dir, type, types, options);
    }

    return result;
  }

  classifyFiles(files, types = defaultTypes, options = {}) {
    let result = {};

    if (!Array.isArray(files)) {
      files = [files];
    }

    for (let type of Object.keys(types)) {
      options = extend({
        matchBase: true
      }, options);
      result[type] = files.filter(minimatch.filter(types[type], options));
    }

    return result;
  }

  listFiles(dir, glob = '**/*', options = {}) {
    options = extend({
      dot: true,
      ignore: ['.*', 'bower_components', 'node_modules']
    }, options);

    return this.filterFiles(dir, glob, options);
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
