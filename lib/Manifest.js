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
import chalk from 'chalk';
import template from 'es6-template';

/**
 * Manifest
 *
 * @class
 */
class Manifest {
  constructor(filepath, override = {}) {
    if(isPlainObject(filepath)){
      this.filepath = '.';
      this.data = filepath;
    } else {
      if(typeof filepath === 'undefined'){
        this.filepath = './manifest.json';
      } else {
        this.filepath = filepath;
      }

      assert(
        file.exists(this.filepath),
        'Manifest file is not exists'
      );

      this.data = file.readJSON(this.filepath);
    }

    this.data = extend(this.data, override);

    this.prepareConfigures();
    this.prepareRegistries();
    this.preparePackages();
    this.prepareDests();
    this.preparePaths();
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

      for (let pkg in this.installedPackages) {
        files = files.concat(this.installedPackages[pkg].getFilesByType(type, options));
      }
    } else {
      files = {};

      for (let pkg in this.installedPackages) {
        let typedFiles = this.installedPackages[pkg].getTypedFiles(options);
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
    if(pkg === null) {
      throw new Error(`Package ${name} is not exists.`);
    }

    if(!pkg.isInstalled()){
      throw new Error(`Package ${pkg.options.registry}:${name} is not installed. Please ${pkg.getInstallCmd()}.`);
    }

    let dests = Object.assign(this.dests, pkg.getDests());
    let paths = Object.assign(this.paths, pkg.getPaths());
    let typedFiles = pkg.getTypedFiles();
    let files = [];
    let renameRules = Object.assign(this.getConfigure('renames'), pkg.options.renames);

    let exists = {};

    for (let type in typedFiles) {
      if(type in dests) {
        typedFiles[type].forEach(filepath => {
          // ${dest}/${type}/${package}/${file}
          let vars = {
            dest: pkg.options.dest,
            package: '',
            type: '',
            file: path.basename(filepath)
          };

          let dest;


          if(!pkg.options.flatten) {
            vars.file = file.getRelativeFromGlobs(filepath, pkg.getGlobByType(type));
          }

          if(renameRules) {
            vars.file = rename(vars.file, renameRules);
          }

          if(!pkg.options.flattenPackages) {
            if(pkg.options.package) {
              vars.package = pkg.options.package;
            } else {
              vars.package = pkg.name;
            }
          }

          if(!pkg.options.flattenTypes) {
            vars.type = dests[type];
          }

          if(type in paths) {
            dest = template(paths[type], vars);
          } else {
            dest = template(pkg.options.path, vars);
          }

          if(typeof exists[dest] === 'undefined') {
            exists[dest] = 0;
          } else {
            exists[dest]++;
            dest = file.getFilenameWithIndex(dest, exists[dest]);
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
    options = Object.assign({
      ignoreError: this.getConfigure('ignoreError')
    }, options);

    let promises = [];
    for (let pkg in this.packages) {
      promises.push(this.copyPackage(pkg, options));
    }
    return Promise.all(promises);
  }

  copyPackage(name, options = {}) {
    options = Object.assign({
      verbose: this.getConfigure('verbose'),
      override: this.getConfigure('override'),
      ignoreError: false,
      log: console.log
    }, options);

    const log = (options.verbose) ? options.log : function() { };

    return new Promise((resolve, reject) => {
      if(options.verbose) {
        log(chalk.blue('Copy Package ') + name + ':');
      }

      if(!this.hasPackage(name)) {
        if(options.ignoreError) {
          log(chalk.red(`Error: Package ${name} is not exists.`));
          return resolve();
        }
        return reject(new Error(`Package ${name} is not exists.`));
      }

      let pkg = this.getPackage(name);

      if(!pkg.isInstalled()) {
        if(options.ignoreError) {
          log(chalk.red(`Error: Package ${pkg.options.registry}:${name} is not installed.`) + ` Please ${pkg.getInstallCmd()}.`);
          return resolve();
        }
        return reject(new Error(`Package ${pkg.options.registry}:${name} is not installed. Please ${pkg.getInstallCmd()}.`));
      }

      let files;
      try {
        files = this.getPackageFileMapping(name);
      } catch (error) {
        reject(error);
      }

      file.copyFiles(files, Object.assign({
        cwd: configure.get('cwd'),
        replaces: Object.assign(this.getConfigure('replaces'), pkg.options.replaces)
      }, options)).then(resolve).catch(reject);
    });
  }

  cleanPackages(options = {}) {
    options = Object.assign({
      ignoreError: this.getConfigure('ignoreError')
    }, options);

    let promises = [];
    for (let pkg in this.packages) {
      promises.push(this.cleanPackage(pkg, options));
    }
    return Promise.all(promises);
  }

  cleanPackage(name, options = {}) {
    options = Object.assign({
      verbose: this.getConfigure('verbose'),
      log: console.log,
      ignoreError: false
    }, options);

    const log = (options.verbose) ? options.log : function() { };

    return new Promise((resolve, reject) => {
      if(options.verbose) {
        log(chalk.magenta('Clean Package ') + name + ':');
      }

      if(!this.hasPackage(name)) {
        if(options.ignoreError) {
          log(chalk.red(`Error: Package ${name} is not exists.`));
          return resolve();
        }
        return reject(new Error(`Package ${name} is not exists.`));
      }

      let pkg = this.getPackage(name);

      if(!pkg.isInstalled()) {
        if(options.ignoreError) {
          log(chalk.red(`Error: Package ${pkg.options.registry}:${name} is not installed.`) + ` Please ${pkg.getInstallCmd()}.`);
          return resolve();
        }
        return reject(new Error(`Package ${pkg.options.registry}:${name} is not installed. Please ${pkg.getInstallCmd()}.`));
      }

      let files;
      try {
        files = this.getPackageFileMapping(name);
      } catch (error) {
        reject(error);
      }

      let destFiles = [];

      files.forEach(file => {
        destFiles.push(file.dest);
      });

      file.cleanFiles(destFiles, Object.assign({
        cwd: configure.get('cwd')
      }, options)).then(resolve).catch(reject);
    });
  }

  getPackage(name) {
    if(name in this.packages) {
      return this.packages[name];
    }
    return null;
  }

  hasPackage(name) {
    if(name in this.packages) {
      return true;
    }
    return false;
  }

  getPackagesInfo(keys = ['name', 'version', 'license'], options = {}) {
    let info = {};

    options = Object.assign({
      fillNull: false
    }, options);

    let packageInfo;
    let obj;

    for (let pkg in this.installedPackages) {
      packageInfo = this.installedPackages[pkg].getInfo();
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
    this.setConfigure('ignoreError',     this.data.ignoreError, true);
    this.setConfigure('defaultRegistry', this.data.defaultRegistry, 'npm');
    this.setConfigure('flattenPackages', this.data.flattenPackages, true);
    this.setConfigure('flattenTypes',    this.data.flattenTypes, false);
    this.setConfigure('flatten',         this.data.flatten, false);
    this.setConfigure('types',           this.data.types, defaultTypes);
    this.setConfigure('renames',         this.data.renames, {});
    this.setConfigure('replaces',        this.data.replaces, {});
    this.setConfigure('dest',            this.data.dest, 'assets');
    this.setConfigure('path',            this.data.path, '${dest}/${type}/${package}/${file}');

    let cwd = this.data.cwd;
    if(cwd) {
      if(!path.isAbsolute(cwd)) {
        cwd = path.resolve((this.filepath === '.'? '': path.dirname(this.filepath)), cwd);
      }
    }

    this.setConfigure('cwd', cwd, process.cwd());
  }

  prepareRegistries() {
    for(let key in this.data.registries) {
      configure.set(`registry.${key}.dir`, this.data.registries[key]);
    }
  }

  preparePaths() {
    this.paths = Object.assign({}, this.data.paths || {});

    Object.assign(this.paths, util.parseOptions(this.data, 'path'));
  }

  prepareDests() {
    this.dests = Object.assign({
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

    Object.assign(this.dests, util.parseOptions(this.data, 'dest'));
  }

  preparePackages() {
    let packages = {};
    let installedPackages = {};

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
      if(pkg.isInstalled()){
        installedPackages[name] = pkg;
      }
    }

    this.packages = packages;
    this.installedPackages = installedPackages;
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
    if(typeof config === 'string') {
      return {
        defination: config,
        options: {}
      }
    }
    if (Array.isArray(config)) {
      if(typeof config[0] !== 'string') {
        return {
          defination: config[0],
          options: config[1] || {}
        };
      }

      if(config[1] && isPlainObject(config[1])){
        return {
          defination: config[0],
          options: config[1]
        }
      }

      return {
        defination: config,
        options: {}
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
