'use strict';

import assert from 'assert';
import path from 'path';
import finder from './finder';
import configure from './configure';

/**
 * Registry
 */
class Registry {
  constructor(options = {}) {
    this.options = Object.assign({
      cwd: configure.get('cwd', process.cwd()),
      dir: null
    }, options);

    assert(
      path.isAbsolute(this.options.cwd || ''),
      'options.cwd must be an absolute path'
    );
  }

  getPackageMainFiles(packageName) {
    const info = this.getPackageInfo(packageName);

    if (info && info.main) {
      if (typeof info.main === 'string') {
        return [info.main];
      }
      return info.main;
    }

    return null;
  }

  getPackageFiles(packageName, options = {}) {
    return finder.listFiles(this.getPackagePath(packageName), options);
  }

  getPackageTypedFiles(packageName, options = {}) {
    options = Object.assign({
      main: false,
      types: configure.get('types')
    }, options);

    let main = options.main;
    let types = options.types;

    delete options.main;
    delete options.types;

    let dir;
    if (main === false) {
      dir = this.getPackagePath(packageName);
    } else {
      dir = this.getPackageMainFiles(packageName);
    }

    return finder.classifyFiles(dir, types, options);
  }

  getPackagePath(packageName) {
    return path.join(this.options.dir, packageName);
  }
}

export default Registry;
