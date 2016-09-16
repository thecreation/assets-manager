'use strict';

import file from './file';
import assert from 'assert';
import Package from './Package';
import isPlainObject from 'is-plain-object';
import configure from './configure';
import path from 'path';
import defaultTypes from './types';
import util from './util';
import rename from './rename';
import extend from 'deep-extend';
/**
 * Manifest
 *
 * @class
 */
class Manifest {
  constructor(path, override = {}) {
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

    this.data = extend(this.data, override);

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

    let self = this;

    Object.keys(packages).forEach(function(key) {
      let pkg = packages[key];

      if(type) {
        let files = [];

        files = pkg.getFilesByType(type);

        callback.call(self, pkg, files);
      } else {
        callback.call(self, pkg);
      }
    });
  }

  getPackagesFiles(type, options) {
    if(isPlainObject(type) && typeof options === 'undefined') {
      options = type;
      type = null;
    }

    let files;
    if(type) {
      files = [];

      for (let pkg in this.packages) {
        files = files.concat(this.packages[pkg].getFilesByType(type, options));
      }
    } else {
      files = {};

      for (let pkg in this.packages) {
        let typedFiles = this.packages[pkg].getTypedFiles(options);
        for (let t in typedFiles){
          if(t in files) {
            files[t] = files[t].concat(typedFiles[t]);
          } else {
            files[t] = typedFiles[t];
          }
        }
      }
    }

    return files;
  }

  getPackageFileMapping(name) {
    let pkg = this.getPackage(name);
    let dests = Object.assign(this.dests, pkg.getDests());
    let typedFiles = pkg.getTypedFiles();
    let files = [];
    let renameRules = Object.assign(this.getConfigure('renames'), pkg.options.renames);

    for (let type in typedFiles) {
      if(type in dests) {
        typedFiles[type].forEach(filepath => {
          let dest;
          let basename = path.basename(filepath);

          if(renameRules) {
            basename = rename(basename, renameRules);
          }
          /*eslint no-lonely-if: "off"*/
          if(pkg.options.flattenPackages){
            if(pkg.options.flattenTypes) {
              dest = path.join(this.dest, basename);
            } else {
              dest = path.join(dests[type], basename);
            }
          } else {
            if(pkg.options.flattenTypes) {
              dest = path.join(this.dest, pkg.name, basename);
            } else {
              dest = path.join(dests[type], pkg.name, basename);
            }
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
    let pkg = this.getPackage(name);

    options = Object.assign({
      verbose: this.getConfigure('verbose'),
      override: this.getConfigure('override'),
      replaces: Object.assign(this.getConfigure('replaces'), pkg.options.replaces)
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
      verbose: this.getConfigure('verbose')
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
    this.setConfigure('verbose',         this.data.verbose, true);
    this.setConfigure('override',        this.data.override, true);
    this.setConfigure('defaultRegistry', this.data.defaultRegistry, 'npm');
    this.setConfigure('flattenPackages', this.data.flattenPackages, true);
    this.setConfigure('flattenTypes',    this.data.flattenTypes, false);
    this.setConfigure('types',           this.data.types, defaultTypes);
    this.setConfigure('renames',         this.data.renames, {});
    this.setConfigure('replaces',        this.data.replaces, {});

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
