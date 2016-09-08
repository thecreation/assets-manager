'use strict';

import {expect} from 'chai';
import Manifest from '../lib/Manifest';
import Package from '../lib/Package';
import path from 'path';
import cd from './helpers/cd';
import file from '../lib/file';
import configure from '../lib/configure';

let FIXTURES = path.join(__dirname, 'fixtures');

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
    expect(configure.get('cwd')).to.be.equal(path.resolve(FIXTURES, 'manifest'));

    let manifest2 = new Manifest({
      cwd: '../bower'
    });
    expect(configure.get('cwd')).to.be.equal(path.resolve(FIXTURES, 'bower'));

    let manifest3 = new Manifest({});
    expect(configure.get('cwd')).to.be.equal(path.resolve(FIXTURES, 'manifest'));
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

  it('should clean package destination files correctly', () => {
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
    manifest.forEachPackage(function(){
      expect(this).to.be.an.instanceof(Package);
      count ++;
    });
    expect(count).to.be.equal(2);

    count = 0;
    manifest.forEachPackage('js', function(files){
      count ++;

      expect(this).to.be.an.instanceof(Package);
      expect(files).to.be.an.instanceof(Array);
    });
    expect(count).to.be.equal(2);
  });
});
