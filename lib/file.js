'use strict';

import fs from 'fs-extra';
import chalk from 'chalk';
import path from 'path';

class File {
  locate(filepath, options = {}) {
    if(path.isAbsolute(filepath)){
      return filepath;
    }
    options = Object.assign({
      cwd: process.cwd()
    }, options);

    return path.join(options.cwd, filepath);
  }

  remove(filepath, options) {
    return new Promise((resolve, reject) => {
        fs.remove(this.locate(filepath, options), err => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
  }

  read(filename, options = {}) {
    return new Promise((resolve, reject) => {
      fs.readFile(this.locate(filename, options), (err, content) => {
        if (err) {
          reject(err);
        } else {
          resolve(content);
        }
      });
    });
  }

  exists(filename, options) {
    try {
      return fs.statSync(this.locate(filename, options)).isFile();
    } catch (e) {
      if (e.code === 'ENOENT') {
        return false;
      }

      throw e;
    }
  }

  isDirectory(directory, options) {
    try {
      return fs.statSync(this.locate(directory, options)).isDirectory();
    } catch (e) {
      if (e.code === 'ENOENT') {
        return false;
      }

      throw e;
    }
  }

  copy(src, dest, options) {
    return new Promise((resolve, reject) => {
      fs.copy(this.locate(src, options), this.locate(dest, options), options || {}, err => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
      });
    });
  }

  readJSON(filepath, defaults, options) {
    filepath = this.locate(filepath, options);

    if (this.exists(filepath)) {
      try {
        return JSON.parse(fs.readFileSync(filepath));
      } catch (error) {
        throw new Error('Could not parse JSON in file: ' + filepath + '. Detail: ' + error.message);
      }
    } else {
      return defaults;
    }
  }

  cleanFiles(files, options) {
    options = Object.assign({
      verbose: false,
      log: console.log,
      ignore: true
    }, options);

    const log = (options.verbose) ? options.log : function() { };

    return new Promise((resolve, reject) => {
      if (!Array.isArray(files)) {
        files = [files];
      }
      let opts = {};
      if(options.cwd) {
        opts.cwd = options.cwd;
      }

      let all = files.map(target => {
        return this.remove(target, opts)
          .then(log(chalk.red('Removing: ') + target))
          .catch(err => {
            if(options.ignore === false) {
              reject(`Cannot clean '${target}': ${err.code}`);
            }
          });
      });

      Promise.all(all)
        .then(resolve)
        .catch(reject);
    });
  }

  copyFiles(files, options) {
    options = Object.assign({
      verbose: false,
      override: true,
      log: console.log
    }, options);

    const log = (options.verbose) ? options.log : function() { };

    return new Promise((resolve, reject) => {
      if (!Array.isArray(files)) {
        files = [files];
      }

      let opts = {
        clobber: options.override,
        preserveTimestamps: false
      };
      if(options.cwd) {
        opts.cwd = options.cwd;
      }

      let all = files.map(target => {
        return this.copy(target.src, target.dest, opts)
          .then(log(chalk.green('Copying: ') + target.src + chalk.cyan(' -> ') + target.dest))
          .catch(err => {
            reject(`Cannot copy ${target.src}'' to '${target.dest}': ${err.message}`);
          });
      });

      Promise.all(all)
        .then(resolve)
        .catch(reject);
    });
  }
}

const file = new File();

export default file;
