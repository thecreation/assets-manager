'use strict';

import Bower from './Registry/Bower';
import Npm from './Registry/Npm';
import Custom from './Registry/Custom';
import configure from './configure';
import file from './file';
import path from 'path';
import isPlainObject from 'is-plain-object';
import util from './util';

class Package {
  constructor(name, defination, options = {}) {
    this.name = name;
    this.defination = defination;
    this.options = Object.assign({
      flattenPackages: configure.get('flattenPackages', true),
      flattenTypes: configure.get('flattenTypes', false),
      flatten: configure.get('flatten', false),
      override: configure.get('override', true),
      registry: configure.get('defaultRegistry', 'npm'),
      renames: {},
      replaces: {}
    }, options);

    switch (this.options.registry) {
      case 'bower':
        this.registry = new Bower();
        break;
      case 'npm':
        this.registry = new Npm();
        break;
      default:
        this.registry = new Custom(this.options.registry);
        break;
    }

    this.path = this.registry.getPackagePath(this.name);
    this.globs = {};
  }

  isInstalled() {
    return file.isDirectory(this.path, {
      cwd: configure.get('cwd', process.cwd())
    });
  }

  hasDirectory(directory) {
    return file.isDirectory(path.join(this.path, directory), {
      cwd: configure.get('cwd', process.cwd())
    });
  }

  getDests() {
    if(this.dests) {
      return this.dests;
    }

    let dests = util.parseOptions(this.options, 'dest');
    this.dests = Object.assign(this.options.dests || {}, dests);

    return this.dests;
  }

  getMainFiles() {
    this.mainFiles = this.registry.getPackageMainFiles(this.name);
    return this.mainFiles;
  }

  getFilesByType(type) {
    if(type in this.getTypedFiles()) {
      return this.typedFiles[type];
    }
    return [];
  }

  getFiles(options = {}) {
    if(this.files) {
      return this.files;
    }
    this.files = this.registry.getPackageFiles(this.name, options);
    return this.files;
  }

  getTypedFiles() {
    if(this.typedFiles) {
      return this.typedFiles;
    }
    let defination = this.defination;

    if (defination === true) {
      this.typedFiles = this.registry.getPackageTypedFiles(this.name, {
        main: true
      });
    } else if(typeof defination === 'string' || Array.isArray(defination)) {
      let globs = this.getGlobsFromDefination(defination);

      this.typedFiles = this.registry.getPackageTypedFiles(this.name, {
        main: false,
        globs: globs
      });
    } else if (isPlainObject(defination)) {
      let types = {};

      for (let type in defination) {
        types[type] = this.getGlobsFromDefination(defination[type]);

        if (isPlainObject(types[type])) {
          types[type] = [];

          for (let file in defination[type]) {
            types[type].push(defination[type][file]);

            this.options.renames[path.basename(defination[type][file])] = file;
          }
        }
      }

      this.typedFiles = this.registry.getPackageTypedFiles(this.name, {
        types: types,
        main: false
      });
    }

    return this.typedFiles;
  }

  getGlobsFromDefination(defination) {
    if (typeof defination === 'string' && this.hasDirectory(defination)) {
      return `${defination}/**/*`;
    }
    return defination;
  }

  getGlobByType(type) {
    if(typeof this.globs[type] === 'undefined') {
      let glob = '.';
      let defination = this.defination;

      if (defination === true) {
        glob = '.';
      } else if(typeof defination === 'string' || Array.isArray(defination)) {
        glob = this.getGlobsFromDefination(defination);
      } else if (isPlainObject(defination)) {
        if(type in defination) {
          glob = this.getGlobsFromDefination(defination[type]);

          if(isPlainObject(glob)) {
            glob = '.';
          }
        } else {
          glob = '.';
        }
      }

      this.globs[type] = glob;
    }

    return this.globs[type];
  }

  getPath() {
    return this.registry.getPackagePath(this.name);
  }

  getInfo(key) {
    return this.registry.getPackageInfo(this.name, key);
  }

  getInstallCmd() {
    return this.registry.getPackageInstallCmd(this.name);
  }
}

export default Package;
