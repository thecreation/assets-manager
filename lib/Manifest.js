'use strict';

import file from './file';
import assert from 'assert';
import Package from './Package';
import isPlainObject from 'is-plain-object';
import configure from './configure';
import path from 'path';
import defaultTypes from './types';

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

    this.prepareRegistries();
    this.preparePackages();
    this.prepareConfigures();
    this.prepareDests();
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

      keys.forEach(function(key){
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

  prepareConfigures() {
    function setConfigure(key, value, def) {
      if(typeof value === 'undefined') {
        configure.set(key, def);
      } else {
        configure.set(key, value);
      }
    }

    setConfigure('clean', this.data.clean, true);
    setConfigure('flattenPackages', this.data.flattenPackages, false);
    setConfigure('flattenTypes',    this.data.flattenTypes, false);
    setConfigure('defaultRegistry', this.data.defaultRegistry, 'npm');
    setConfigure('types', this.data.types, defaultTypes);

    let cwd = this.data.cwd;
    if(cwd) {
      if(!path.isAbsolute(cwd)) {
        cwd = path.resolve((this.path === '.'? '': path.dirname(this.path)), cwd);
      }
    }

    setConfigure('cwd', cwd, process.cwd());
  }

  prepareRegistries() {
    let registries = {};

    for(let key in this.data.registries) {
      configure.set(`registry.${key}.dir`, this.data.registries[key]);
    }
  }

  prepareDests() {
    this.dest = this.data || 'assets';
    this.dests = Object.assign({
      "images": "images",
      "fonts": "fonts",
      "js": "js",
      "coffee": "source/coffee",
      "es6": "source/es6",
      "css": "css",
      "stylus": "source/stylus",
      "less": "source/less",
      "sass": "source/sass",
      "scss": "source/scss"
    }, this.data.dests || {});
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

      if(packages.hasOwnProperty(name)) {
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
