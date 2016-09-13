"use strict";

import Bower from '../lib/Registry/Bower';
import path from 'path';
import cd from './helpers/cd';
import fillTypes from './helpers/fillTypes';
import chai from 'chai';
import dirtyChai from 'dirty-chai';

chai.use(dirtyChai);

const expect = chai.expect;
const FIXTURES = path.join(__dirname, 'fixtures');

describe('Bower Registry', () => {
  afterEach(() => {
    cd.reset();
  });

  it('should exists', () => {
    const bower = new Bower();
    expect(bower).to.exist();
  });

  it('should set bower configurations', () => {
    cd('bower');
    let bower = new Bower();

    expect(bower.options).to.be.eql({
      cwd: path.resolve(FIXTURES, 'bower'),
      json: 'bower.json',
      dir: 'bower_components',
      overrides: {},
      componentJson: '.bower.json'
    });
  });

  it('should fail if cwd isn\'t absolute', () => {
    cd('bower');
    let bower;
    let error;
    try {
      bower = new Bower({
        cwd: 'bower'
      });
    } catch (err) {
      error = err;
    }
    expect(bower).to.be.equal(undefined);
    expect(error).to.be.instanceOf(Error);
  });

  it('should respect .bowerrc', () => {
    cd('bowerrc');

    let bower = new Bower();
    expect(bower.options).to.be.eql({
      cwd: path.resolve(FIXTURES, 'bowerrc'),
      json: 'bower.json',
      dir: 'components',
      overrides: {},
      componentJson: '.bower.json'
    });
  });

  it('should respect given dir option', () => {
    cd('bower');

    let bower = new Bower({dir: 'components'});
    expect(bower.options).to.be.eql({
      cwd: path.resolve(FIXTURES, 'bower'),
      json: 'bower.json',
      dir: 'components',
      overrides: {},
      componentJson: '.bower.json'
    });
  });

  it('should return package path', () => {
    cd('bower');

    let bower = new Bower();
    expect(bower.getPackagePath('bootstrap')).to.be.eql(
      path.join('bower_components', 'bootstrap')
    );
  });

  describe('getPackageInfo()', () => {
    it('should return package info', () => {
      cd('bower');

      let bower = new Bower();
      let results = bower.getPackageInfo('bootstrap');
      expect(results).to.exist();
      expect(results.name).to.be.equal('bootstrap');
    });

    it('should return package info key value if key assigned', () => {
      cd('bower');

      let bower = new Bower();
      expect(bower.getPackageInfo('bootstrap', 'name')).to.be.equal('bootstrap');
    });

    it('should return undefined if key not exists', () => {
      cd('bower');

      let bower = new Bower();
      expect(bower.getPackageInfo('bootstrap', 'hello')).to.be.equal(undefined);
    });

    it('should return null if package not exists', () => {
      cd('bower');

      let bower = new Bower();
      let results = bower.getPackageInfo('non-exists');
      expect(results).to.null();
    });
  });

  it('should return package files', () => {
    cd('bower');

    let bower = new Bower();
    expect(bower.getPackageFiles('normalize-css')).to.be.eql([
      'bower.json',
      'LICENSE.md',
      'normalize.css'
    ]);
  });

  it('should return typed files', () => {
    cd('bower');

    let bower = new Bower();
    expect(bower.getPackageTypedFiles('notie')).to.be.eql(fillTypes({
      js: ['dist/notie.min.js', 'gulpfile.js', 'src/notie.js'],
      css: ['dist/notie.css'],
      scss: ['src/notie.scss'],
      images: ['demo.gif']
    }));
  });

  describe('getPackageMainFiles()', () => {
    it('should return main files', () => {
      cd('bower');

      let bower = new Bower();
      expect(bower.getPackageMainFiles('bootstrap')).to.be.eql([
        'less/bootstrap.less',
        'dist/js/bootstrap.js'
      ]);
    });

    it('should return main files with null if package not exists', () => {
      cd('bower');

      let bower = new Bower();
      let results = bower.getPackageMainFiles('non-exists');
      expect(results).to.null();
    });

    it('should convent single main file to array', () => {
      cd('bower');

      let bower = new Bower();
      expect(bower.getPackageMainFiles('jquery')).to.be.eql([
        'dist/jquery.js'
      ]);
    });
  });
});
