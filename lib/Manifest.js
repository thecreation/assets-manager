'use strict';

import file from './file';
import assert from 'assert';
import Package from './Package';
import isPlainObject from 'is-plain-object';
import configure from './configure';
import path from 'path';
import defaultTypes from './types';
import util from '../lib/util';

/**
 * Manifest
 *
 * @class
 */
class Manifest {
  constructor(path) {
    if(isPlainObject(path)){
      this.path = '.';
      this.data = path;
    } else {
      if(typeof path === 'undefined'){
        this.path = './manifest.json';
      } else {
        this.path = path;
      }

      assert(
        file.exists(this.path),
        'Manifest file is not exists'
      );

      this.data = file.readJSON(this.path);
    }

    this.prepareConfigures();
    this.prepareRegistries();
    this.preparePackages();
    this.prepareDests();
  }

  forEachPackage(type, callback) {
    if(typeof type === 'function' && typeof callback === 'undefined') {
      callback = type;
      type = null;
    }
    let packages = this.packages;

    Object.keys(packages).forEach(function(key) {
      let pkg = packages[key];
      let files = [];

      if(type) {
        files = pkg.getFilesByType(type);
      }
      callback.call(pkg, files);
    });
  }

  getPackagesFiles(type, options = {}) {
    let files = {};

    for (let pkg in this.packages) {
      let typedFiles = this.packages[pkg].getTypedFiles(options);
      for (let type in typedFiles){
        if(type in files) {
          files[type] = files[type].concat(typedFiles[type]);
        } else {
          files[type] = typedFiles[type];
        }
      }
    }

    return files;
  }

  getPackageFileMapping(name) {
    let pkg = this.getPackage(name);
    let dests = Object.assign(this.dests, pkg.getDests());
    let flattenPackages = util.extendVal(this.getConfigure('flattenPackages'), pkg.options.flattenPackages);
    let typedFiles = pkg.getTypedFiles();
    let files = [];

    for (let type in typedFiles) {
      if(type in dests) {
        typedFiles[type].forEach(filepath => {
          let dest;

          if(flattenPackages){
            dest = path.join(dests[type], path.basename(filepath));
          } else {
            dest = path.join(dests[type], pkg.name, path.basename(filepath));
          }

          files.push({
            src: path.join(pkg.path, filepath),
            dest: dest
          });
        });
      }
    }
    return files;
  }

  copyPackages(options = {}) {
    let promises = [];
    for (let pkg in this.packages) {
      promises.push(this.copyPackage(pkg, options));
    }
    return Promise.all(promises);
  }

  copyPackage(name, options = {}) {
    options = Object.assign({
      verbose: true,
      override: true
    }, options);

    let files = this.getPackageFileMapping(name);

    return file.copyFiles(files, Object.assign({
      cwd: configure.get('cwd')
    }, options));
  }

  cleanPackages(options = {}) {
    let promises = [];
    for (let pkg in this.packages) {
      promises.push(this.cleanPackage(pkg, options));
    }
    return Promise.all(promises);
  }

  cleanPackage(name, options = {}) {
    options = Object.assign({
      verbose: true
    }, options);

    let files = this.getPackageFileMapping(name);
    let destFiles = [];

    files.forEach(file => {
      destFiles.push(file.dest);
    });

    return file.cleanFiles(destFiles, Object.assign({
      cwd: configure.get('cwd')
    }, options));
  }

  getPackage(name) {
    if(name in this.packages) {
      return this.packages[name];
    }
    return null;
  }

  getPackagesInfo(keys = ['name', 'version', 'license'], options = {}) {
    let info = {};

    options = Object.assign({
      fillNull: false
    }, options);

    let packageInfo;
    let obj;

    for (let pkg in this.packages) {
      packageInfo = this.packages[pkg].getInfo();
      obj = {};

      /*eslint no-loop-func: "off"*/
      keys.forEach(key => {
        if(key in packageInfo) {
          obj[key] = packageInfo[key];
        } else if(options.fillNull) {
          obj[key] = null;
        }
      });
      info[pkg] = obj;
    }

    return info;
  }

  setConfigure(key, value, def) {
    if(typeof value === 'undefined') {
      configure.set(key, def);
    } else {
      configure.set(key, value);
    }
  }

  getConfigure(key) {
    return configure.get(key);
  }

  prepareConfigures() {
    this.setConfigure('flattenPackages', this.data.flattenPackages, true);
    this.setConfigure('flattenTypes',    this.data.flattenTypes, false);
    this.setConfigure('defaultRegistry', this.data.defaultRegistry, 'npm');
    this.setConfigure('types', this.data.types, defaultTypes);

    let cwd = this.data.cwd;
    if(cwd) {
      if(!path.isAbsolute(cwd)) {
        cwd = path.resolve((this.path === '.'? '': path.dirname(this.path)), cwd);
      }
    }

    this.setConfigure('cwd', cwd, process.cwd());
  }

  prepareRegistries() {
    for(let key in this.data.registries) {
      configure.set(`registry.${key}.dir`, this.data.registries[key]);
    }
  }

  prepareDests() {
    this.dest = this.data.dest || 'assets';

    let dests = Object.assign({
      images: 'images',
      fonts: 'fonts',
      js: 'js',
      coffee: 'source/coffee',
      es6: 'source/es6',
      css: 'css',
      stylus: 'source/stylus',
      less: 'source/less',
      sass: 'source/sass',
      scss: 'source/scss'
    }, this.data.dests || {});

    this.dests = {};
    for(let type in dests) {
      this.dests[type] = path.join(this.dest, dests[type]);
    }

    Object.assign(this.dests, util.parseOptions(this.data, 'dest'));
  }

  preparePackages() {
    let packages = {};

    for(let key in this.data.packages) {
      let {name, registry} = this.parsePackageKey(key);
      let {defination, options} = this.parsePackageConfig(this.data.packages[key]);

      if(registry !== null){
        options.registry = registry;
      }

      let pkg = new Package(name, defination, options);

      if(Object.hasOwnProperty.call(packages, name)) {
        if(Array.isArray(packages[name])) {
          packages[name].push(pkg)
        } else {
          packages[name] = [packages[name], pkg];
        }
      } else {
        packages[name] = pkg;
      }
    }

    this.packages = packages;
  }

  parsePackageKey(text) {
    let regex = /^([^:\s]+):([^:\s]+)$/;
    let match = regex.exec(text);

    if (match) {
      return {
        name: match[2],
        registry: match[1]
      };
    }

    return {
      name: text,
      registry: null
    };
  }

  parsePackageConfig(config) {
    if (config === true) {
      return {
        defination: true,
        options: {}
      };
    }
    if (Array.isArray(config)) {
      return {
        defination: config[0],
        options: config[1] || {}
      };
    }
    if (isPlainObject(config)) {
      return {
        defination: config,
        options: {}
      };
    }
  }
}

export default Manifest;
