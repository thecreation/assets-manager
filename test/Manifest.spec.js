/*eslint max-nested-callbacks: ["error", 6]*/

'use strict';

import Manifest from '../lib/Manifest';
import Package from '../lib/Package';
import path from 'path';
import cd from './helpers/cd';
import file from '../lib/file';
import configure from '../lib/configure';
import finder from '../lib/finder';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import dirtyChai from 'dirty-chai';
import del from 'del';
import sinonChai from 'sinon-chai';
import sinon from 'sinon';
import fillTypes from './helpers/fillTypes';

chai.use(chaiAsPromised);
chai.use(dirtyChai);
chai.use(sinonChai);

const expect = chai.expect;
const FIXTURES = path.join(__dirname, 'fixtures');

describe('Manifest', () => {
  afterEach(() => {
    cd.reset();
    configure.clear();
    del.sync(path.resolve(FIXTURES, 'manifest', 'assets'));
  });

  it('should initialise correctly', () => {
    cd('bower');

    let manifest = new Manifest();

    expect(manifest.data).to.be.eql(file.readJSON('./manifest.json'));
  });

  it('should initialise with manifest file path correctly', () => {
    cd('bower');

    let manifest = new Manifest('./manifest.json');

    expect(manifest.data).to.be.eql(file.readJSON('./manifest.json'));
  });

  it('should initialise with manifest object', () => {
    cd('bower');

    let data = {
      registries: {
        vendor: "vendor"
      }
    };
    let manifest = new Manifest(data);

    expect(manifest.data).to.be.eql(data);
  });

  it('should override the manifest object with the second arg', () => {
    cd('bower');

    let data = {
      registries: {
        vendor: "vendor"
      }
    };
    let manifest = new Manifest(data, {
      registries: {
        vendor: "libs"
      }
    });

    expect(manifest.data.registries.vendor).to.be.equal('libs');
  });

  it('should fail if manifest file is not valid', () => {
    let manifest;
    let error;

    try {
      manifest = new Manifest('./invalid.json');
    } catch (err) {
      error = err;
    }

    expect(manifest).to.be.equal(undefined);
    expect(error).to.be.instanceOf(Error);
  });

  it('should fail if manifest file is not exists', () => {
    cd('bowerrc');

    let manifest;
    let error;

    try {
      manifest = new Manifest();
    } catch (err) {
      error = err;
    }

    expect(manifest).to.be.equal(undefined);
    expect(error).to.be.instanceOf(Error);
  });

  it('should prepare packages correctly', () => {
    cd('bower');

    let manifest = new Manifest();
    let packages = manifest.packages;
    expect(packages.bootstrap).to.be.instanceOf(Package);
    expect(packages.bootstrap.name).to.be.equal('bootstrap');
  });

  it('should prepare packages correctly (duplicate packages)', () => {
    cd('manifest');

    let manifest = new Manifest('./duplicate.json');
    let packages = manifest.packages;
    expect(packages.bootstrap).to.be.instanceof(Array);
    expect(packages.bootstrap[0]).to.be.instanceOf(Package);
  });

  it('should parse package name correctly', () => {
    cd('bower');

    let manifest = new Manifest();

    expect(manifest.parsePackageKey('npm:bootstrap')).to.be.eql({
      name: 'bootstrap',
      registry: 'npm'
    });

    expect(manifest.parsePackageKey('bower:animate.css')).to.be.eql({
      name: 'animate.css',
      registry: 'bower'
    });

    expect(manifest.parsePackageKey('libs:normalize-css')).to.be.eql({
      name: 'normalize-css',
      registry: 'libs'
    });

    expect(manifest.parsePackageKey('bootstrap')).to.be.eql({
      name: 'bootstrap',
      registry: null
    });
  });

  describe('parsePackageConfig()', () => {
    it('should parese package config correctly', () => {
      cd('bower');

      let manifest = new Manifest();

      expect(manifest.parsePackageConfig(true)).to.be.eql({
        defination: true,
        options: {}
      });

      expect(manifest.parsePackageConfig("**/*")).to.be.eql({
        defination: "**/*",
        options: {}
      });

      expect(manifest.parsePackageConfig(["dist/**/*.js", "!dist/**/*.min.js"])).to.be.eql({
        defination: ["dist/**/*.js", "!dist/**/*.min.js"],
        options: {}
      });

      expect(manifest.parsePackageConfig(["**/*", {
        registry: "bower"
      }])).to.be.eql({
        defination: "**/*",
        options: {
          registry: "bower"
        }
      });

      expect(manifest.parsePackageConfig([["**/*", "!**/*.min.js"], {
        registry: "bower"
      }])).to.be.eql({
        defination: ["**/*", "!**/*.min.js"],
        options: {
          registry: "bower"
        }
      });

      expect(manifest.parsePackageConfig([
        true,
        {
          registry: "bower"
        }
      ])).to.be.eql({
        defination: true,
        options: {
          registry: "bower"
        }
      });

      expect(manifest.parsePackageConfig([
        {
          js: "dist/js",
          css: "dist/css",
          less: "less",
          fonts: "dist/fonts"
        }
      ])).to.be.eql({
        defination: {
          js: "dist/js",
          css: "dist/css",
          less: "less",
          fonts: "dist/fonts"
        },
        options: {}
      });

      expect(manifest.parsePackageConfig([
        {
          js: "dist/js",
          css: "dist/css",
          less: "less",
          fonts: "dist/fonts"
        },
        {
          registry: "bower"
        }
      ])).to.be.eql({
        defination: {
          js: "dist/js",
          css: "dist/css",
          less: "less",
          fonts: "dist/fonts"
        },
        options: {
          registry: "bower"
        }
      });

      expect(manifest.parsePackageConfig({
        js: "dist/js",
        css: "dist/css",
        less: "less",
        fonts: "dist/fonts"
      })).to.be.eql({
        defination: {
          js: "dist/js",
          css: "dist/css",
          less: "less",
          fonts: "dist/fonts"
        },
        options: {}
      });
    });
    it('should get files types automatically without definations', () => {
      cd('bower');

      let manifest = new Manifest({
        packages: {
          'bower:normalize-css': '**/*'
        }
      });

      let pkg = manifest.getPackage('normalize-css');

      expect(pkg.getTypedFiles()).to.be.eql(fillTypes({
        css: [
          'normalize.css'
        ]
      }));
    });

    it('should get files types with main files', () => {
      cd('bower');

      let manifest = new Manifest({
        packages: {
          'bower:bootstrap': true
        }
      });

      let pkg = manifest.getPackage('bootstrap');

      expect(pkg.getTypedFiles()).to.be.eql(fillTypes({
        less: [
          'less/bootstrap.less'
        ],
        js: [
          'dist/js/bootstrap.js'
        ]
      }));
    });

    it('should get files types with files array definations', () => {
      cd('bower');

      let manifest = new Manifest({
        packages: {
          'bower:bootstrap': {
              js: ['dist/js/bootstrap.js'],
              css: ['dist/css/bootstrap.css', 'dist/css/bootstrap-theme.css']
            }
        }
      });

      let pkg = manifest.getPackage('bootstrap');

      expect(pkg.getTypedFiles()).to.be.eql({
        css: [
          'dist/css/bootstrap.css',
          'dist/css/bootstrap-theme.css'
        ],
        js: [
          'dist/js/bootstrap.js'
        ]
      });
    });

    it('should get files types with definations', () => {
      cd('bower');

      let manifest = new Manifest({
        packages: {
          'bower:bootstrap': {
            js: 'dist/js',
            css: ['dist/css/*.css', '!dist/css/*.min.css']
          }
        }
      });

      let pkg = manifest.getPackage('bootstrap');

      expect(pkg.getTypedFiles()).to.be.eql({
        css: [
          'dist/css/bootstrap-theme.css',
          'dist/css/bootstrap.css'
        ],
        js: [
          'dist/js/bootstrap.js',
          'dist/js/bootstrap.min.js',
          'dist/js/npm.js'
        ]
      });
    });

    it('should get files types with files object definations', () => {
      cd('bower');

      let manifest = new Manifest({
        packages: {
          'bower:bootstrap': {
            js: {
              'bootstrap.js': 'dist/js/bootstrap.min.js'
            },
            css: {
              'main.css':'dist/css/bootstrap.css',
              'theme.css':'dist/css/bootstrap-theme.css'
            }
          }
        }
      });

      let pkg = manifest.getPackage('bootstrap');

      expect(pkg.getTypedFiles()).to.be.eql({
        css: [
          'dist/css/bootstrap.css',
          'dist/css/bootstrap-theme.css'
        ],
        js: [
          'dist/js/bootstrap.min.js'
        ]
      });
    });
  });

  describe('cwd', () => {
    it('should set cwd correctly', () => {
      cd('manifest');

      let manifest = new Manifest({
        cwd: '.'
      });
      expect(manifest.getConfigure('cwd')).to.be.equal(path.resolve(FIXTURES, 'manifest'));

      let manifest2 = new Manifest({
        cwd: '../bower'
      });
      expect(manifest2.getConfigure('cwd')).to.be.equal(path.resolve(FIXTURES, 'bower'));

      let manifest3 = new Manifest({});
      expect(manifest3.getConfigure('cwd')).to.be.equal(path.resolve(FIXTURES, 'manifest'));
    });

    it('should set cwd correctly when manifest file is not same with the registries folders', () => {
      cd(FIXTURES);

      let manifest = new Manifest({
        cwd: './manifest',
        packages: {
          "bower:jquery": true,
          "npm:bootstrap": true
        }
      });

      let jquery = manifest.getPackage('jquery');
      expect(jquery.isInstalled()).to.be.true();

      let bootstrap = manifest.getPackage('bootstrap');
      expect(bootstrap.isInstalled()).to.be.true();
    });
  });

  describe('getPackagesInfo()', () => {
    it('should get packages info correctly', () => {
      cd('manifest');

      let manifest = new Manifest();
      expect(manifest.getPackagesInfo(['name', 'version', 'license'])).to.be.eql({
        bootstrap: {
          name: 'bootstrap',
          version: '3.3.7',
          license: 'MIT'
        },
        jquery: {
          name: 'jquery',
          version: '3.1.0',
          license: 'MIT'
        }
      });

      expect(manifest.getPackagesInfo(['name', 'version', 'license', 'undefined'], {fillNull: true})).to.be.eql({
        bootstrap: {
          name: 'bootstrap',
          version: '3.3.7',
          license: 'MIT',
          undefined: null
        },
        jquery: {
          name: 'jquery',
          version: '3.1.0',
          license: 'MIT',
          undefined: null
        }
      });
    });
  });

  describe('getPackage()', () => {
    it('should get package by name correctly', () => {
      cd('manifest');

      let manifest = new Manifest();
      let pkg = manifest.getPackage('bootstrap');

      expect(pkg).to.be.an.instanceof(Package);
      expect(pkg.name).to.be.equal('bootstrap');

      expect(manifest.getPackage('un-exists')).to.be.equal(null);
    });
  });

  describe('hasPackage()', () => {
    it('should return true if package defined in manifest', () => {
      let manifest = new Manifest({
        packages: {
          "bower:jquery": true,
          "npm:bootstrap": true
        }
      });

      expect(manifest.hasPackage('jquery')).to.be.true();
    });

    it('should return false if package defined in manifest', () => {
      let manifest = new Manifest({
        packages: {
          "bower:jquery": true,
          "npm:bootstrap": true
        }
      });

      expect(manifest.hasPackage('un-defined')).to.be.false();
    });
  });

  it('should loop packages correctly', () => {
    cd('manifest');

    let manifest = new Manifest({
      packages: {
        "bower:jquery": {
          js: 'dist/jquery.js'
        },
        "npm:bootstrap": [{
          js: 'dist/js/bootstrap.js'
        }]
      }
    });

    let count = 0;
    manifest.forEachPackage(function(pkg){
      expect(pkg).to.be.an.instanceof(Package);
      count ++;
    });
    expect(count).to.be.equal(2);

    count = 0;
    manifest.forEachPackage('js', function(pkg, files){
      count ++;

      expect(pkg).to.be.an.instanceof(Package);
      expect(files).to.be.an.instanceof(Array);
    });
    expect(count).to.be.equal(2);
  });

  describe('copyPackage()', function(){
    it('should copy package correctly', () => {
      cd('manifest');

      let manifest = new Manifest({
        packages: {
          "bower:jquery": {
            js: 'dist/jquery.js'
          },
          "npm:bootstrap": [{
            js: 'dist/js/bootstrap.js'
          }]
        },
        dist: 'assets',
        verbose: false
      });

      return manifest.copyPackage('bootstrap').then(() => {
        let dir = path.resolve(FIXTURES, 'manifest', 'assets');
        let files = finder.listFiles(dir);
        expect('js/bootstrap.js').to.be.oneOf(files);

        return manifest.cleanPackage('bootstrap').then(() => {
          let dir = path.resolve(FIXTURES, 'assets');
          let files = finder.listFiles(dir);

          expect('js/bootstrap.js').to.not.be.oneOf(files);
        });
      });
    });

    it('should log package copy when options.verbose = true', () => {
      let log = {
        info: sinon.spy()
      };

      cd('manifest');

      let manifest = new Manifest({
        packages: {
          "npm:bootstrap": [{
            js: 'dist/js/bootstrap.js'
          }]
        },
        verbose: true
      });

      return manifest.copyPackage('bootstrap', {
        log: log.info
      }).then(() => {
        let dir = path.resolve(FIXTURES, 'manifest', 'assets');
        let files = finder.listFiles(dir);
        expect('js/bootstrap.js').to.be.oneOf(files);
        expect(log.info).to.be.calledTwice();
      });
    });

    it('should not log package copy when options.verbose = false', () => {
      let log = {
        info: sinon.spy()
      };

      cd('manifest');

      let manifest = new Manifest({
        packages: {
          "npm:bootstrap": [{
            js: 'dist/js/bootstrap.js'
          }]
        },
        verbose: false
      });

      return manifest.copyPackage('bootstrap', {
        log: log.info
      }).then(() => {
        let dir = path.resolve(FIXTURES, 'manifest', 'assets');
        let files = finder.listFiles(dir);
        expect('js/bootstrap.js').to.be.oneOf(files);
        expect(log.info).to.not.be.called();
      });
    });

    it('should catch error if package not exists when ignoreError = false', () => {
      cd('manifest');

      let manifest = new Manifest({
        packages: {
          "npm:bootstrap": true
        }
      });

      return manifest.copyPackage('undefined', {
        ignoreError: false,
        verbose: false
      }).then(() => {
        expect('called').to.not.exist();
      }).catch((error) => {
        expect(error).to.exist();
        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.be.equal('Package undefined is not exists.');
      });
    });

    it('should not catch error if package not exists when ignoreError = true', () => {
      cd('manifest');

      let manifest = new Manifest({
        packages: {
          "npm:bootstrap": true
        }
      });

      let log = {
        info: sinon.spy()
      };

      return manifest.copyPackage('undefined', {
        ignoreError: true,
        log: log.info
      }).then(() => {
        expect(log.info).to.be.called();
      }).catch((error) => {
        expect(error).to.not.exist();
      });
    });

    it('should catch error if package not installed when ignoreError = false', () => {
      cd('manifest');

      let manifest = new Manifest({
        packages: {
          "npm:uninstalled": true
        }
      });

      return manifest.copyPackage('uninstalled', {
        ignoreError: false,
        verbose: false
      }).then(() => {
        expect('called').to.not.exist();
      }).catch((error) => {
        expect(error).to.exist();
        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.contain('Package npm:uninstalled is not installed');
      });
    });

    it('should not catch error if package not exists when ignoreError = true', () => {
      cd('manifest');

      let manifest = new Manifest({
        packages: {
          "npm:uninstalled": true
        }
      });

      let log = {
        info: sinon.spy()
      };

      return manifest.copyPackage('uninstalled', {
        ignoreError: true,
        log: log.info
      }).then(() => {
        expect(log.info).to.be.called();
      }).catch((error) => {
        expect(error).to.not.exist();
      });
    });

    it('should catch error if package not exists by default', () => {
      cd('manifest');

      let manifest = new Manifest({
        packages: {
          "npm:uninstalled": true
        }
      });

      return manifest.copyPackage('uninstalled', {
        verbose: false
      }).then(() => {
        expect('called').to.not.exist();
      }).catch((error) => {
        expect(error).to.exist();
        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.contain('Package npm:uninstalled is not installed');
      });
    });
  });

  describe('cleanPackage()', function(){
    it('should clean package files correctly', () => {
      cd('manifest');

      let manifest = new Manifest({
        packages: {
          "npm:bootstrap": [{
            js: 'dist/js/bootstrap.js'
          }]
        },
        verbose: false
      });

      return manifest.cleanPackage('bootstrap').then(() => {
        let dir = path.resolve(FIXTURES, 'manifest', 'assets');
        let files = finder.listFiles(dir);
        expect('js/bootstrap.js').to.not.be.oneOf(files);
      });
    });

    it('should log package copy when options.verbose = true', () => {
      let log = {
        info: sinon.spy()
      };

      cd('manifest');

      let manifest = new Manifest({
        packages: {
          "npm:bootstrap": [{
            js: 'dist/js/bootstrap.js'
          }]
        },
        verbose: true
      });

      return manifest.cleanPackage('bootstrap', {
        log: log.info
      }).then(() => {
        let dir = path.resolve(FIXTURES, 'manifest', 'assets');
        let files = finder.listFiles(dir);
        expect('js/bootstrap.js').to.not.be.oneOf(files);
        expect(log.info).to.be.calledTwice();
      });
    });

    it('should not log package clean when options.verbose = false', () => {
      let log = {
        info: sinon.spy()
      };

      cd('manifest');

      let manifest = new Manifest({
        packages: {
          "npm:bootstrap": [{
            js: 'dist/js/bootstrap.js'
          }]
        },
        verbose: false
      });

      return manifest.cleanPackage('bootstrap', {
        log: log.info
      }).then(() => {
        let dir = path.resolve(FIXTURES, 'manifest', 'assets');
        let files = finder.listFiles(dir);
        expect('js/bootstrap.js').to.not.be.oneOf(files);
        expect(log.info).to.not.be.called();
      });
    });

    it('should catch error if package not exists when ignoreError = false', () => {
      cd('manifest');

      let manifest = new Manifest({
        packages: {
          "npm:bootstrap": true
        }
      });

      return manifest.cleanPackage('undefined', {
        ignoreError: false,
        verbose: false
      }).then(() => {
        expect('called').to.not.exist();
      }).catch((error) => {
        expect(error).to.exist();
        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.be.equal('Package undefined is not exists.');
      });
    });

    it('should not catch error if package not exists when ignoreError = true', () => {
      cd('manifest');

      let manifest = new Manifest({
        packages: {
          "npm:bootstrap": true
        }
      });

      let log = {
        info: sinon.spy()
      };

      return manifest.cleanPackage('undefined', {
        ignoreError: true,
        log: log.info
      }).then(() => {
        expect(log.info).to.be.called();
      }).catch((error) => {
        expect(error).to.not.exist();
      });
    });

    it('should catch error if package not installed when ignoreError = false', () => {
      cd('manifest');

      let manifest = new Manifest({
        packages: {
          "npm:uninstalled": true
        }
      });

      return manifest.cleanPackage('uninstalled', {
        ignoreError: false,
        verbose: false
      }).then(() => {
        expect('called').to.not.exist();
      }).catch((error) => {
        expect(error).to.exist();
        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.contain('Package npm:uninstalled is not installed');
      });
    });

    it('should not catch error if package not exists when ignoreError = true', () => {
      cd('manifest');

      let manifest = new Manifest({
        packages: {
          "npm:uninstalled": true
        }
      });

      let log = {
        info: sinon.spy()
      };

      return manifest.cleanPackage('uninstalled', {
        ignoreError: true,
        log: log.info
      }).then(() => {
        expect(log.info).to.be.called();
      }).catch((error) => {
        expect(error).to.not.exist();
      });
    });

    it('should catch error if package not exists by default', () => {
      cd('manifest');

      let manifest = new Manifest({
        packages: {
          "npm:uninstalled": true
        }
      });

      return manifest.cleanPackage('uninstalled', {
        verbose: false
      }).then(() => {
        expect('called').to.not.exist();
      }).catch((error) => {
        expect(error).to.exist();
        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.contain('Package npm:uninstalled is not installed');
      });
    });
  });

  describe('copyPackages()', () => {
    it('should copy packages correctly', () => {
      cd('manifest');

      let manifest = new Manifest({
        packages: {
          "bower:jquery": {
            js: 'dist/jquery.js'
          },
          "npm:bootstrap": [{
            js: 'dist/js/bootstrap.js'
          }]
        },
        verbose: false
      });

      return manifest.copyPackages().then(() => {
        let dir = path.resolve(FIXTURES, 'manifest', 'assets');
        let files = finder.listFiles(dir);
        expect('js/bootstrap.js').to.be.oneOf(files);
        expect('js/jquery.js').to.be.oneOf(files);

        return manifest.cleanPackages().then(() => {
          let dir = path.resolve(FIXTURES, 'manifest', 'assets');
          let files = finder.listFiles(dir);

          expect('js/bootstrap.js').to.not.be.oneOf(files);
          expect('js/jquery.js').to.not.be.oneOf(files);
        });
      });
    });

    it('should copy packages with duplicated files correctly', () => {
      cd('manifest');

      let manifest = new Manifest({
        flatten: true,
        packages: {
          "npm:bootstrap": "less"
        },
        dests: {
          less: "less"
        },
        verbose: false
      });

      return manifest.copyPackages().then(() => {
        let dir = path.resolve(FIXTURES, 'manifest', 'assets');
        let files = finder.listFiles(dir);
        expect('less/grid.less').to.be.oneOf(files);
        expect('less/grid-1.less').to.be.oneOf(files);

        return manifest.cleanPackages().then(() => {
          let dir = path.resolve(FIXTURES, 'manifest', 'assets');
          let files = finder.listFiles(dir);

          expect('less/grid.less').to.not.be.oneOf(files);
          expect('less/grid-1.less').to.not.be.oneOf(files);
        });
      });
    });

    it('should work with specific cwd correctly', () => {
      cd(FIXTURES);

      let manifest = new Manifest({
        packages: {
          "bower:jquery": {
            js: 'dist/jquery.js'
          },
          "npm:bootstrap": [{
            js: 'dist/js/bootstrap.js'
          }]
        },
        cwd: './manifest',
        dest: 'assets',
        verbose: false
      });

      return manifest.copyPackages().then(() => {
        let dir = path.resolve(FIXTURES, 'manifest', 'assets');
        let files = finder.listFiles(dir);
        expect('js/bootstrap.js').to.be.oneOf(files);
        expect('js/jquery.js').to.be.oneOf(files);

        return manifest.cleanPackages().then(() => {
          let dir = path.resolve(FIXTURES, 'manifest', 'assets');
          let files = finder.listFiles(dir);

          expect('js/bootstrap.js').to.not.be.oneOf(files);
          expect('js/jquery.js').to.not.be.oneOf(files);
        });
      });
    });

  });


  describe('getPackagesFiles()', () => {
    it('should get packages files for specify type', () => {
      cd('manifest');

      let manifest = new Manifest({
        packages: {
          "bower:jquery": {
            js: 'dist/jquery.js'
          },
          "npm:bootstrap": [{
            js: 'dist/js/bootstrap.js'
          }]
        }
      });

      expect(manifest.getPackagesFiles('js')).to.be.eql([
        'dist/jquery.js',
        'dist/js/bootstrap.js'
      ]);
    });

    it('should get packages files correctly', () => {
      cd('manifest');

      let manifest = new Manifest({
        packages: {
          "bower:jquery": {
            js: 'dist/jquery.js'
          },
          "npm:bootstrap": [{
            js: 'dist/js/bootstrap.js'
          }]
        }
      });

      expect(manifest.getPackagesFiles()).to.be.eql({
        js: [
          'dist/jquery.js',
          'dist/js/bootstrap.js'
        ]
      });
    });

    it('should use first arg as options when it is a object', () => {
      cd('manifest');

      let manifest = new Manifest({
        packages: {
          "bower:jquery": {
            js: 'dist/jquery.js'
          },
          "npm:bootstrap": [{
            js: 'dist/js/bootstrap.js'
          }]
        }
      });

      expect(manifest.getPackagesFiles({})).to.be.eql({
        js: [
          'dist/jquery.js',
          'dist/js/bootstrap.js'
        ]
      });
    });
  });

  describe('configures', () => {
    it('should set default configures correctly', () => {
      cd('manifest');

      let manifest = new Manifest();

      expect(manifest.getConfigure('cwd')).to.be.equal(process.cwd());
      expect(manifest.getConfigure('defaultRegistry')).to.be.equal('npm');
      expect(manifest.getConfigure('flattenPackages')).to.be.equal(true);
      expect(manifest.getConfigure('flattenTypes')).to.be.equal(false);
      expect(manifest.getConfigure('flatten')).to.be.equal(false);
      expect(manifest.getConfigure('verbose')).to.be.equal(true);
      expect(manifest.getConfigure('override')).to.be.equal(true);
    });

    describe('renames', () => {
      it('should working with renames options', () => {
        cd('manifest');

        let manifest = new Manifest({
          flatten: false,
          flattenTypes: false,
          flattenPackages: true,
          packages: {
            "npm:bootstrap": [{
              js: 'dist/js/bootstrap.min.js',
              css: 'dist/css/bootstrap.min.css'
            }, {
              renames: {
                'bootstrap.min.js': 'bootstrap.js'
              }
            }]
          },
          dest: 'assets',
          verbose: false
        });

        return manifest.copyPackages().then(() => {
          let dir = path.resolve(FIXTURES, 'manifest', 'assets');
          let files = finder.listFiles(dir);
          expect('js/bootstrap.js').to.be.oneOf(files);

          return manifest.cleanPackages().then(() => {
            let dir = path.resolve(FIXTURES, 'manifest', 'assets');
            let files = finder.listFiles(dir);

            expect('js/bootstrap.js').to.not.be.oneOf(files);
          });
        });
      });

      it('should working with files mapping', () => {
        cd('manifest');

        let manifest = new Manifest({
          flatten: false,
          flattenTypes: false,
          flattenPackages: true,
          packages: {
            "npm:bootstrap": {
              js: {
                'bootstrap.js': 'dist/js/bootstrap.min.js',
              },
              css: {
                'bootstrap.css': 'dist/css/bootstrap.min.css',
              }
            }
          },
          dest: 'assets',
          verbose: false
        });

        return manifest.copyPackages().then(() => {
          let dir = path.resolve(FIXTURES, 'manifest', 'assets');
          let files = finder.listFiles(dir);
          expect('js/bootstrap.js').to.be.oneOf(files);
          expect('css/bootstrap.css').to.be.oneOf(files);

          return manifest.cleanPackages().then(() => {
            let dir = path.resolve(FIXTURES, 'manifest', 'assets');
            let files = finder.listFiles(dir);

            expect('js/bootstrap.js').to.not.be.oneOf(files);
            expect('css/bootstrap.css').to.not.be.oneOf(files);
          });
        });
      });
    });

    describe('replaces', () => {
      it('should working with replaces options', () => {
        cd('manifest');

        let manifest = new Manifest({
          flatten: false,
          flattenTypes: false,
          flattenPackages: true,
          packages: {
            "npm:bootstrap": [{
              js: 'dist/js/bootstrap.js',
              css: 'dist/js/bootstrap.css'
            }, {
              replaces: {
                '*.js': {
                  bootstrap: 'anotherstring'
                }
              }
            }]
          },
          dest: 'assets',
          verbose: false
        });

        return manifest.copyPackages().then(() => {
          let dir = path.resolve(FIXTURES, 'manifest', 'assets');
          let files = finder.listFiles(dir);
          expect('js/bootstrap.js').to.be.oneOf(files);

          return file.read(path.resolve(FIXTURES, 'manifest', 'assets', 'js', 'bootstrap.js')).then(content => {
            content = content.toString();
            expect(content).to.contain('anotherstring');
            expect(content).to.not.contain('bootstrap');
          });
        });
      });
    });

    describe('flattenTypes', () => {
      it('should flatten types when true', () => {
        cd('manifest');

        let manifest = new Manifest({
          flatten: false,
          flattenTypes: true,
          flattenPackages: false,
          packages: {
            "npm:bootstrap": {
              js: 'dist/js/bootstrap.js',
              css: 'dist/css/bootstrap.css'
            },
            "bower:jquery": [{
              js: 'dist/jquery.js'
            }, {
              flattenPackages: true
            }]
          },
          dest: 'assets',
          path: '${dest}/${type}/${package}/${file}',
          verbose: false
        });

        return manifest.copyPackages().then(() => {
          let dir = path.resolve(FIXTURES, 'manifest', 'assets');
          let files = finder.listFiles(dir);
          expect('bootstrap/bootstrap.js').to.be.oneOf(files);
          expect('bootstrap/bootstrap.css').to.be.oneOf(files);
          expect('jquery.js').to.be.oneOf(files);

          return manifest.cleanPackages().then(() => {
            let dir = path.resolve(FIXTURES, 'manifest', 'assets');
            let files = finder.listFiles(dir);

            expect('bootstrap/bootstrap.js').to.not.be.oneOf(files);
            expect('bootstrap/bootstrap.css').to.not.be.oneOf(files);
            expect('jquery.js').to.not.be.oneOf(files);
          });
        });
      });

      it('should not flatten types when false', () => {
        cd('manifest');

        let manifest = new Manifest({
          flatten: false,
          flattenTypes: false,
          flattenPackages: false,
          packages: {
            "npm:bootstrap": {
              js: 'dist/js/bootstrap.js',
              css: 'dist/css/bootstrap.css'
            },
            "bower:jquery": [{
              js: 'dist/jquery.js'
            }, {
              flattenPackages: true
            }]
          },
          dest: 'assets',
          path: '${dest}/${type}/${package}/${file}',
          verbose: false
        });

        return manifest.copyPackages().then(() => {
          let dir = path.resolve(FIXTURES, 'manifest', 'assets');
          let files = finder.listFiles(dir);

          expect('js/bootstrap/bootstrap.js').to.be.oneOf(files);
          expect('css/bootstrap/bootstrap.css').to.be.oneOf(files);
          expect('js/jquery.js').to.be.oneOf(files);

          return manifest.cleanPackages().then(() => {
            let dir = path.resolve(FIXTURES, 'manifest', 'assets');
            let files = finder.listFiles(dir);

            expect('js/bootstrap/bootstrap.js').to.not.be.oneOf(files);
            expect('css/bootstrap/bootstrap.css').to.not.be.oneOf(files);
            expect('js/jquery.js').to.not.be.oneOf(files);
          });
        });
      });
    });

    describe('flattenPackages', () => {
      it('should flatten packages', () => {
        cd('manifest');

        let manifest = new Manifest({
          flatten: false,
          flattenTypes: false,
          flattenPackages: true,
          packages: {
            "bower:jquery": {
              js: 'dist/jquery.js'
            },
            "npm:bootstrap": [{
              js: 'dist/js/bootstrap.js'
            }, {
              flattenTypes: true
            }]
          },
          dest: 'assets',
          path: '${dest}/${type}/${package}/${file}',
          verbose: false
        });

        return manifest.copyPackages().then(() => {
          let dir = path.resolve(FIXTURES, 'manifest', 'assets');
          let files = finder.listFiles(dir);
          expect('bootstrap.js').to.be.oneOf(files);
          expect('js/jquery.js').to.be.oneOf(files);

          return manifest.cleanPackages().then(() => {
            let dir = path.resolve(FIXTURES, 'manifest', 'assets');
            let files = finder.listFiles(dir);

            expect('bootstrap.js').to.not.be.oneOf(files);
            expect('js/jquery.js').to.not.be.oneOf(files);
          });
        });
      });

      it('should not flatten packages', () => {
        cd('manifest');

        let manifest = new Manifest({
          flatten: false,
          flattenTypes: false,
          flattenPackages: false,
          packages: {
            "bower:jquery": {
              js: 'dist/jquery.js'
            },
            "npm:bootstrap": [{
              js: 'dist/js/bootstrap.js'
            }, {
              flattenTypes: true
            }]
          },
          dest: 'assets',
          path: '${dest}/${type}/${package}/${file}',
          verbose: false
        });

        return manifest.copyPackages().then(() => {
          let dir = path.resolve(FIXTURES, 'manifest', 'assets');
          let files = finder.listFiles(dir);
          expect('bootstrap/bootstrap.js').to.be.oneOf(files);
          expect('js/jquery/jquery.js').to.be.oneOf(files);

          return manifest.cleanPackages().then(() => {
            let dir = path.resolve(FIXTURES, 'manifest', 'assets');
            let files = finder.listFiles(dir);

            expect('bootstrap/bootstrap.js').to.not.be.oneOf(files);
            expect('js/jquery/jquery.js').to.not.be.oneOf(files);
          });
        });
      });
    });

    describe('flatten', () => {
      it('should flatten paths when set to true', () => {
        cd('manifest');

        let manifest = new Manifest({
          flatten: true,
          flattenTypes: false,
          flattenPackages: true,
          packages: {
            "bower:bootstrap": "less"
          },
          dest: 'assets',
          dests: {
            less: "less",
          },
          path: '${dest}/${type}/${package}/${file}',
          verbose: false
        });

        return manifest.copyPackages().then(() => {
          let dir = path.resolve(FIXTURES, 'manifest', 'assets');
          let files = finder.listFiles(dir);

          expect('less/grid.less').to.be.oneOf(files);

          return manifest.cleanPackages().then(() => {
            let dir = path.resolve(FIXTURES, 'manifest', 'assets');
            let files = finder.listFiles(dir);

            expect('less/grid.less').to.not.be.oneOf(files);
          });
        });
      });

      it('should not flatten paths when set to false', () => {
        cd('manifest');

        let manifest = new Manifest({
          flatten: false,
          flattenTypes: false,
          flattenPackages: true,
          packages: {
            "bower:bootstrap": "less"
          },
          dest: 'assets',
          dests: {
            less: "less",
          },
          path: '${dest}/${type}/${package}/${file}',
          verbose: false
        });

        return manifest.copyPackages().then(() => {
          let dir = path.resolve(FIXTURES, 'manifest', 'assets');
          let files = finder.listFiles(dir);
          expect('less/mixins/grid.less').to.be.oneOf(files);

          return manifest.cleanPackages().then(() => {
            let dir = path.resolve(FIXTURES, 'manifest', 'assets');
            let files = finder.listFiles(dir);

            expect('less/mixins/grid.less').to.not.be.oneOf(files);
          });
        });
      });
    });

    describe('dest', () => {
      it('should work with dest options', () => {
        cd('manifest');

        let manifest = new Manifest({
          flatten: false,
          flattenTypes: false,
          flattenPackages: true,
          packages: {
            "npm:bootstrap": {
              js: 'dist/js',
              css: 'dist/css'
            }
          },
          path: '${dest}/${type}/${package}/${file}',
          dest: 'assets',
          verbose: false
        });

        return manifest.copyPackages().then(() => {
          let dir = path.resolve(FIXTURES, 'manifest', 'assets');
          let files = finder.listFiles(dir);

          expect('css/bootstrap.css').to.be.oneOf(files);

          return manifest.cleanPackages().then(() => {
            let dir = path.resolve(FIXTURES, 'manifest', 'assets');
            let files = finder.listFiles(dir);

            expect('css/bootstrap.css').to.not.be.oneOf(files);
          });
        });
      });

      it('should work with dests', () => {
        cd('manifest');

        let manifest = new Manifest({
          flatten: false,
          flattenTypes: false,
          flattenPackages: true,
          packages: {
            "npm:bootstrap": {
              js: 'dist/js',
              css: 'dist/css'
            }
          },
          path: '${dest}/${type}/${package}/${file}',
          dest: 'assets',
          dests: {
            css: 'another',
          },
          verbose: false
        });

        return manifest.copyPackages().then(() => {
          let dir = path.resolve(FIXTURES, 'manifest', 'assets');
          let files = finder.listFiles(dir);

          expect('another/bootstrap.css').to.be.oneOf(files);

          return manifest.cleanPackages().then(() => {
            let dir = path.resolve(FIXTURES, 'manifest', 'assets');
            let files = finder.listFiles(dir);

            expect('another/bootstrap.css').to.not.be.oneOf(files);
          });
        });
      });


      it('should work with dest:{type} option', () => {
        cd('manifest');

        let manifest = new Manifest({
          flatten: false,
          flattenTypes: false,
          flattenPackages: true,
          packages: {
            "npm:bootstrap": {
              js: 'dist/js',
              css: 'dist/css'
            }
          },
          path: '${dest}/${type}/${package}/${file}',
          dest: 'assets',
          'dest:css': 'another',
          verbose: false
        });

        return manifest.copyPackages().then(() => {
          let dir = path.resolve(FIXTURES, 'manifest', 'assets');
          let files = finder.listFiles(dir);

          expect('another/bootstrap.css').to.be.oneOf(files);

          return manifest.cleanPackages().then(() => {
            let dir = path.resolve(FIXTURES, 'manifest', 'assets');
            let files = finder.listFiles(dir);

            expect('another/bootstrap.css').to.not.be.oneOf(files);
          });
        });
      });

      it('should work with package options', () => {
        cd('manifest');

        let manifest = new Manifest({
          flatten: false,
          flattenTypes: false,
          flattenPackages: true,
          packages: {
            "npm:bootstrap": [{
              js: 'dist/js',
              css: 'dist/css'
            }, {
              'dest:css': 'another',
              dest: 'assets/hello',
            }]
          },
          path: '${dest}/${type}/${package}/${file}',
          dest: 'assets',
          verbose: false
        });

        return manifest.copyPackages().then(() => {
          let dir = path.resolve(FIXTURES, 'manifest', 'assets');
          let files = finder.listFiles(dir);

          expect('hello/another/bootstrap.css').to.be.oneOf(files);

          return manifest.cleanPackages().then(() => {
            let dir = path.resolve(FIXTURES, 'manifest', 'assets');
            let files = finder.listFiles(dir);

            expect('hello/another/bootstrap.css').to.not.be.oneOf(files);
          });
        });
      });

    });

    describe('path', () => {
      it('should work with default path define', () => {
        cd('manifest');
        let manifest = new Manifest({
          flatten: false,
          flattenTypes: false,
          flattenPackages: false,
          packages: {
            "npm:bootstrap": {
              js: 'dist/js',
              css: 'dist/css'
            }
          },
          dest: 'assets',
          dests: {
            css: 'another',
          },
          path: '${dest}/${type}/${package}/${file}',
          verbose: false
        });

        return manifest.copyPackages().then(() => {
          let dir = path.resolve(FIXTURES, 'manifest', 'assets');
          let files = finder.listFiles(dir);

          expect('another/bootstrap/bootstrap.css').to.be.oneOf(files);
          expect('js/bootstrap/bootstrap.js').to.be.oneOf(files);

          return manifest.cleanPackages().then(() => {
            let dir = path.resolve(FIXTURES, 'manifest', 'assets');
            let files = finder.listFiles(dir);

            expect('another/bootstrap/bootstrap.css').to.not.be.oneOf(files);
            expect('js/bootstrap/bootstrap.js').to.not.be.oneOf(files);
          });
        });
      });

      it('should work with another path define', () => {
        cd('manifest');
        let manifest = new Manifest({
          flatten: false,
          flattenTypes: false,
          flattenPackages: false,
          packages: {
            "npm:bootstrap": {
              js: 'dist/js',
              css: 'dist/css'
            }
          },

          dest: 'assets',
          dests: {
            css: 'another',
          },
          path: '${dest}/${package}/${type}/${file}',
          verbose: false
        });

        return manifest.copyPackages().then(() => {
          let dir = path.resolve(FIXTURES, 'manifest', 'assets');
          let files = finder.listFiles(dir);

          expect('bootstrap/another/bootstrap.css').to.be.oneOf(files);
          expect('bootstrap/js/bootstrap.js').to.be.oneOf(files);

          return manifest.cleanPackages().then(() => {
            let dir = path.resolve(FIXTURES, 'manifest', 'assets');
            let files = finder.listFiles(dir);

            expect('bootstrap/another/bootstrap.css').to.not.be.oneOf(files);
            expect('bootstrap/js/bootstrap.js').to.not.be.oneOf(files);
          });
        });
      });

      it('should work with no package var', () => {
        cd('manifest');
        let manifest = new Manifest({
          flatten: false,
          flattenTypes: false,
          flattenPackages: false,
          packages: {
            "npm:bootstrap": {
              js: 'dist/js',
              css: 'dist/css'
            }
          },

          dest: 'assets',
          dests: {
            css: 'another',
          },
          path: '${dest}/${type}/${file}',
          verbose: false
        });

        return manifest.copyPackages().then(() => {
          let dir = path.resolve(FIXTURES, 'manifest', 'assets');
          let files = finder.listFiles(dir);

          expect('another/bootstrap.css').to.be.oneOf(files);
          expect('js/bootstrap.js').to.be.oneOf(files);

          return manifest.cleanPackages().then(() => {
            let dir = path.resolve(FIXTURES, 'manifest', 'assets');
            let files = finder.listFiles(dir);

            expect('another/bootstrap.css').to.not.be.oneOf(files);
            expect('js/bootstrap.js').to.not.be.oneOf(files);
          });
        });
      });

      it('should work with no type var', () => {
        cd('manifest');
        let manifest = new Manifest({
          flatten: false,
          flattenTypes: false,
          flattenPackages: false,
          packages: {
            "npm:bootstrap": {
              js: 'dist/js',
              css: 'dist/css'
            }
          },
          dest: 'assets',
          dests: {
            css: 'another',
          },
          path: '${dest}/${package}/${file}',
          verbose: false
        });

        return manifest.copyPackages().then(() => {
          let dir = path.resolve(FIXTURES, 'manifest', 'assets');
          let files = finder.listFiles(dir);

          expect('bootstrap/bootstrap.css').to.be.oneOf(files);
          expect('bootstrap/bootstrap.js').to.be.oneOf(files);

          return manifest.cleanPackages().then(() => {
            let dir = path.resolve(FIXTURES, 'manifest', 'assets');
            let files = finder.listFiles(dir);

            expect('bootstrap/bootstrap.css').to.not.be.oneOf(files);
            expect('bootstrap/bootstrap.js').to.not.be.oneOf(files);
          });
        });
      });

      it('should work with paths override for type', () => {
        cd('manifest');
        let manifest = new Manifest({
          flatten: false,
          flattenTypes: false,
          flattenPackages: false,
          packages: {
            "npm:bootstrap": {
              js: 'dist/js',
              css: 'dist/css'
            }
          },
          dest: 'assets',
          path: '${dest}/${package}/${file}',
          paths: {
            css: '${dest}/src/${package}/${file}'
          },
          verbose: false
        });

        return manifest.copyPackages().then(() => {
          let dir = path.resolve(FIXTURES, 'manifest', 'assets');
          let files = finder.listFiles(dir);

          expect('src/bootstrap/bootstrap.css').to.be.oneOf(files);
          expect('bootstrap/bootstrap.js').to.be.oneOf(files);

          return manifest.cleanPackages().then(() => {
            let dir = path.resolve(FIXTURES, 'manifest', 'assets');
            let files = finder.listFiles(dir);

            expect('src/bootstrap/bootstrap.css').to.not.be.oneOf(files);
            expect('bootstrap/bootstrap.js').to.not.be.oneOf(files);
          });
        });
      });

      it('should work with path:{type} option', () => {
        cd('manifest');
        let manifest = new Manifest({
          flatten: false,
          flattenTypes: false,
          flattenPackages: false,
          packages: {
            "npm:bootstrap": {
              js: 'dist/js',
              css: 'dist/css'
            }
          },
          dest: 'assets',
          path: '${dest}/${package}/${file}',
          'path:css': '${dest}/src/${package}/${file}',
          verbose: false
        });

        return manifest.copyPackages().then(() => {
          let dir = path.resolve(FIXTURES, 'manifest', 'assets');
          let files = finder.listFiles(dir);

          expect('src/bootstrap/bootstrap.css').to.be.oneOf(files);
          expect('bootstrap/bootstrap.js').to.be.oneOf(files);

          return manifest.cleanPackages().then(() => {
            let dir = path.resolve(FIXTURES, 'manifest', 'assets');
            let files = finder.listFiles(dir);

            expect('src/bootstrap/bootstrap.css').to.not.be.oneOf(files);
            expect('bootstrap/bootstrap.js').to.not.be.oneOf(files);
          });
        });
      });

      it('should work with package option', () => {
        cd('manifest');
        let manifest = new Manifest({
          flatten: false,
          flattenTypes: false,
          flattenPackages: false,
          packages: {
            "npm:bootstrap": [{
              js: 'dist/js',
              css: 'dist/css'
            }, {
              path: '${dest}/${package}/${file}',
              paths: {
                css: '${dest}/src/${package}/${file}'
              }
            }]
          },
          dest: 'assets',
          verbose: false
        });

        return manifest.copyPackages().then(() => {
          let dir = path.resolve(FIXTURES, 'manifest', 'assets');
          let files = finder.listFiles(dir);

          expect('src/bootstrap/bootstrap.css').to.be.oneOf(files);
          expect('bootstrap/bootstrap.js').to.be.oneOf(files);

          return manifest.cleanPackages().then(() => {
            let dir = path.resolve(FIXTURES, 'manifest', 'assets');
            let files = finder.listFiles(dir);

            expect('src/bootstrap/bootstrap.css').to.not.be.oneOf(files);
            expect('bootstrap/bootstrap.js').to.not.be.oneOf(files);
          });
        });
      });
    });
  });
});
