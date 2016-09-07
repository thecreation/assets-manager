'use strict';

import Bower from './Registry/Bower';
import Npm from './Registry/Npm';
import Custom from './Registry/Custom';
import configure from './configure';
import file from './file';
import path from 'path';
import isPlainObject from 'is-plain-object';

class Package {
  constructor(name, defination, options = {}) {
    this.name = name;
    this.defination = defination;
    this.options = Object.assign({
      clean: configure.get('clean', true),
      flatten: configure.get('flatten', false),
      main: configure.get('main', false),
      registry: configure.get('defaultRegistry', 'npm')
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

  getMainFiles() {
    return this.registry.getPackageMainFiles(this.name);
  }

  getFiles() {
    return this.registry.getPackageFiles(this.name);
  }

  getTypedFiles(defination) {
    if (typeof defination === 'undefined') {
      defination = this.defination;
    }

    if (defination === true) {
      return this.registry.getPackageTypedFiles(this.name, {
        main: this.options.main
      });
    }

    if (typeof defination === 'object') {
      let types = {};
      let packagePath = this.getPath();

      for (let type in defination) {
        if (typeof defination[type] === 'string' && file.isDirectory(path.join(packagePath, defination[type]))) {
          types[type] = `${defination[type]}/**/*`;
        } else if (isPlainObject(defination[type])) {
          types[type] = [];
          for (let file in defination[type]) {
            types[type].push(defination[type][file]);
          }
        } else {
          types[type] = defination[type];
        }
      }

      return this.registry.getPackageTypedFiles(this.name, {
        types: types,
        main: this.options.main
      });
    }
  }

  getPath() {
    return this.registry.getPackagePath(this.name);
  }

  getInfo(key) {
    return this.registry.getPackageInfo(this.name, key);
  }
}

export default Package;
