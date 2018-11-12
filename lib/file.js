import fs from 'fs-extra';
import chalk from 'chalk';
import path from 'path';
import replace from './replace';
import minimatch from 'minimatch';
import globParent from 'glob-parent';

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
    options = Object.assign({
      encoding: 'utf-8'
    }, options);

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

  copy(src, dest, options) {
    /*eslint no-unneeded-ternary: "off"*/
    options = Object.assign({
      clobber: options.override? true: false,
      preserveTimestamps: false
    }, options);

    delete options.override;

    return new Promise((resolve, reject) => {
      fs.copy(this.locate(src, options), this.locate(dest, options), options, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  replace(src, dest, rules, options) {
    options = Object.assign({
      encoding: 'utf-8',
      override: true
    }, options);

    return this.read(src, options).then(content => {
      content = replace(content.toString(options.encoding), rules);

      return this.write(dest, content, options);
    });
  }

  write(src, content, options) {
    options = Object.assign({
      encoding: 'utf-8',
      override: true
    }, options);

    let override = options.override;
    delete options.override;

    return new Promise((resolve, reject) => {
      let filepath = this.locate(src, options);
      fs.ensureFile(filepath, err => {
        if (err) {
          reject(err);
        }

        if(override) {
          this.remove(filepath, options).then(() => {
            fs.writeFile(filepath, content, options || {}, err => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          }).catch(reject);
        } else {
          fs.writeFile(filepath, content, options || {}, err => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        }
      });
    });
  }

  readJSON(filepath, defaults, options) {
    options = Object.assign({
      encoding: 'utf-8'
    }, options);

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
      ignoreError: true
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
            if(options.ignoreError === false) {
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
      log: console.log,
      replaces: {},
      processes: {}
    }, options);

    const log = (options.verbose) ? options.log : function() { };

    return new Promise((resolve, reject) => {
      if (!Array.isArray(files)) {
        files = [files];
      }

      let opts = {
        override: options.override
      };
      if(options.cwd) {
        opts.cwd = options.cwd;
      }

      let all = files.map(target => {
        let promise = null;
        let replaces = {};

        if(options.replaces) {
          for(let glob in options.replaces) {
            if(minimatch(target.dest, glob, { matchBase: true })) {
              Object.assign(replaces, options.replaces[glob]);
            }
          }
        }

        if(Object.keys(replaces).length === 0) {
          promise = this.copy(target.src, target.dest, opts);
        } else {
          promise = this.replace(target.src, target.dest, replaces, opts);
        }

        if(options.processes) {
          let processes = [];

          for(let glob in options.processes) {
            if(minimatch(target.dest, glob, { matchBase: true })) {
              if(Array.isArray(options.processes[glob])){
                processes = processes.concat(options.processes[glob]);
              } else {
                processes.push(options.processes[glob]);
              }
            }
          }

          if(processes.length !== 0) {

            promise = promise.then(()=> {
              return this.read(target.dest, opts).then(content => {
                content = content.toString(options.encoding);
                processes.forEach((process) => {
                  /* eslint no-eval: "off" */
                  if(typeof process === 'string') {
                    eval("process = " + process);
                  }

                  content = process(content, target.dest);
                });
                return this.write(target.dest, content, options);
              });
            });
          }
        }

        return promise.then(log(chalk.green('Copying: ') + target.src + chalk.cyan(' -> ') + target.dest))
          .catch(err => {
            reject(`Cannot copy ${target.src}'' to '${target.dest}': ${err.message}`);
          });
      });

      Promise.all(all)
        .then(resolve)
        .catch(reject);
    });
  }

  getFilenameWithIndex(filepath, index) {
    let parsed = path.parse(filepath);

    return path.join(parsed.root, parsed.dir, `${parsed.name}-${index}${parsed.ext}`);
  }

  getRelativeFromGlobs(filepath, globs) {
    let glob = this.matchGlob(filepath, globs);

    if(glob) {
      return path.relative(globParent(glob), filepath);
    }

    return path.basename(filepath);
  }

  matchGlob(filepath, globs) {
    if(!Array.isArray(globs)) {
      globs = [globs];
    }

    for(let i in globs) {
      if(minimatch(filepath, globs[i])) {
        return globs[i];
      }
    }

    return false;
  }
}

const file = new File();

export default file;
