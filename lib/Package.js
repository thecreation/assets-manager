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
  }

  isInstalled() {
    return file.isDirectory(this.path);
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
      this.typedFiles = this.registry.getPackageTypedFiles(this.name, {
        main: false,
        globs: defination
      });
    } else if (isPlainObject(defination)) {
      let types = {};
      let packagePath = this.getPath();

      for (let type in defination) {
        if (typeof defination[type] === 'string' && file.isDirectory(path.join(packagePath, defination[type]))) {
          types[type] = `${defination[type]}/**/*`;
        } else if (isPlainObject(defination[type])) {
          types[type] = [];
          for (let file in defination[type]) {
            types[type].push(defination[type][file]);

            this.options.renames[path.basename(defination[type][file])] = file;
          }
        } else {
          types[type] = defination[type];
        }
      }

      this.typedFiles = this.registry.getPackageTypedFiles(this.name, {
        types: types,
        main: false
      });
    }

    return this.typedFiles;
  }

  getPath() {
    return this.registry.getPackagePath(this.name);
  }

  getInfo(key) {
    return this.registry.getPackageInfo(this.name, key);
  }
}

export default Package;
