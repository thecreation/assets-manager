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

    return [];
  }

  getPackageFiles(packageName, options = {}) {
    return finder.listFiles(this.getPackagePath(packageName), '**/*', options);
  }

  getPackageTypedFiles(packageName, options = {}) {
    options = Object.assign({
      main: false,
      globs: null,
      types: configure.get('types')
    }, options);

    let main = options.main;
    let types = options.types;
    let globs = options.globs;

    delete options.main;
    delete options.types;
    delete options.glob;

    let dir = this.getPackagePath(packageName);

    if(main === true) {
      let files = this.getPackageMainFiles(packageName);

      return finder.classifyFiles(files, types, options);
    }

    if(globs) {
      if(!Array.isArray(globs)) {
        globs = [globs];
      }
      return finder.classifyFilesFromGlobs(dir, globs, types, options);
    }

    return finder.classifyFilesFromDir(dir, types, options);
  }

  getPackagePath(packageName) {
    return path.join(this.options.dir, packageName);
  }
}

export default Registry;
