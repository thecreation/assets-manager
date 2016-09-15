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

chai.use(chaiAsPromised);
chai.use(dirtyChai);

const expect = chai.expect;
const FIXTURES = path.join(__dirname, 'fixtures');

describe('Manifest', () => {
  afterEach(() => {
    cd.reset();
    configure.clear();
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

  it('should parese package config correctly', () => {
    cd('bower');

    let manifest = new Manifest();

    expect(manifest.parsePackageConfig(true)).to.be.eql({
      defination: true,
      options: {}
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

  it('should get package by name correctly', () => {
    cd('manifest');

    let manifest = new Manifest();
    let pkg = manifest.getPackage('bootstrap');

    expect(pkg).to.be.an.instanceof(Package);
    expect(pkg.name).to.be.equal('bootstrap');

    expect(manifest.getPackage('un-exists')).to.be.equal(null);
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
        let dir = path.resolve(FIXTURES, 'assets');
        let files = finder.listFiles(dir);

        expect('js/bootstrap.js').to.not.be.oneOf(files);
        expect('js/jquery.js').to.not.be.oneOf(files);
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
      expect(manifest.getConfigure('verbose')).to.be.equal(true);
      expect(manifest.getConfigure('override')).to.be.equal(true);
    });

    describe('renames', () => {
      it('should working with renames options', () => {
        cd('manifest');

        let manifest = new Manifest({
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
            let dir = path.resolve(FIXTURES, 'assets');
            let files = finder.listFiles(dir);

            expect('js/bootstrap.js').to.not.be.oneOf(files);
          });
        });
      });

      it('should working with files mapping', () => {
        cd('manifest');

        let manifest = new Manifest({
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
            let dir = path.resolve(FIXTURES, 'assets');
            let files = finder.listFiles(dir);

            expect('js/bootstrap.js').to.not.be.oneOf(files);
            expect('css/bootstrap.css').to.not.be.oneOf(files);
          });
        });
      });
    });

    describe('flattenTypes', () => {
      it('should flatten types when true', () => {
        cd('manifest');

        let manifest = new Manifest({
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
          verbose: false
        });

        return manifest.copyPackages().then(() => {
          let dir = path.resolve(FIXTURES, 'manifest', 'assets');
          let files = finder.listFiles(dir);
          expect('bootstrap/bootstrap.js').to.be.oneOf(files);
          expect('bootstrap/bootstrap.css').to.be.oneOf(files);
          expect('jquery.js').to.be.oneOf(files);

          return manifest.cleanPackages().then(() => {
            let dir = path.resolve(FIXTURES, 'assets');
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
          verbose: false
        });

        return manifest.copyPackages().then(() => {
          let dir = path.resolve(FIXTURES, 'manifest', 'assets');
          let files = finder.listFiles(dir);

          expect('js/bootstrap/bootstrap.js').to.be.oneOf(files);
          expect('css/bootstrap/bootstrap.css').to.be.oneOf(files);
          expect('js/jquery.js').to.be.oneOf(files);

          return manifest.cleanPackages().then(() => {
            let dir = path.resolve(FIXTURES, 'assets');
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
          verbose: false
        });

        return manifest.copyPackages().then(() => {
          let dir = path.resolve(FIXTURES, 'manifest', 'assets');
          let files = finder.listFiles(dir);
          expect('bootstrap.js').to.be.oneOf(files);
          expect('js/jquery.js').to.be.oneOf(files);

          return manifest.cleanPackages().then(() => {
            let dir = path.resolve(FIXTURES, 'assets');
            let files = finder.listFiles(dir);

            expect('bootstrap.js').to.not.be.oneOf(files);
            expect('js/jquery.js').to.not.be.oneOf(files);
          });
        });
      });

      it('should not flatten packages', () => {
        cd('manifest');

        let manifest = new Manifest({
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
          verbose: false
        });

        return manifest.copyPackages().then(() => {
          let dir = path.resolve(FIXTURES, 'manifest', 'assets');
          let files = finder.listFiles(dir);
          expect('bootstrap/bootstrap.js').to.be.oneOf(files);
          expect('js/jquery/jquery.js').to.be.oneOf(files);

          return manifest.cleanPackages().then(() => {
            let dir = path.resolve(FIXTURES, 'assets');
            let files = finder.listFiles(dir);

            expect('bootstrap/bootstrap.js').to.not.be.oneOf(files);
            expect('js/jquery/jquery.js').to.not.be.oneOf(files);
          });
        });
      });
    });
  });
});
