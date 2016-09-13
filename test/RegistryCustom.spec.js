"use strict";

import Custom from '../lib/Registry/Custom';
import path from 'path';
import cd from './helpers/cd';
import fillTypes from './helpers/fillTypes';
import chai from 'chai';
import dirtyChai from 'dirty-chai';

chai.use(dirtyChai);

const expect = chai.expect;
const FIXTURES = path.join(__dirname, 'fixtures');

describe('Custom Registry', () => {
  afterEach(() => {
    cd.reset();
  });

  it('should exists', () => {
    const custom = new Custom('libs', {
      dir: 'libs'
    });
    expect(custom).to.exist();
  });

  it('should set custom configurations', () => {
    cd('custom');
    let custom = new Custom('libs', {
      dir: 'libs'
    });

    expect(custom.options).to.be.eql({
      cwd: path.resolve(FIXTURES, 'custom'),
      dir: 'libs',
      json: 'package.json',
      overrides: {}
    });
  });

  it('should fail if dir is empty', () => {
    cd('custom');
    let custom;
    let error;
    try {
      custom = new Custom();
    } catch (err) {
      error = err;
    }
    expect(custom).to.be.equal(undefined);
    expect(error).to.be.instanceOf(Error);
  });

  it('should return package path', () => {
    cd('custom');
    let custom = new Custom('libs', {
      dir: 'libs'
    });
    expect(custom.getPackagePath('bootstrap')).to.be.eql(
      path.join('libs', 'bootstrap')
    );
  });

  it('should return package files', () => {
    cd('custom');
    let custom = new Custom('libs', {
      dir: 'libs'
    });

    expect(custom.getPackageFiles('notie')).to.be.eql([
      'demo.gif',
      'dist/notie.css',
      'dist/notie.min.js',
      'package.json',
      'src/notie.js',
      'src/notie.scss'
    ]);
  });

  it('should return typed files', () => {
    cd('custom');
    let custom = new Custom('libs', {
      dir: 'libs'
    });
    expect(custom.getPackageTypedFiles('notie')).to.be.eql(fillTypes({
      js: ['dist/notie.min.js', 'src/notie.js'],
      css: ['dist/notie.css'],
      scss: ['src/notie.scss'],
      images: ['demo.gif']
    }));
  });

  describe('getPackageInfo()', () => {
    it('should return package info', () => {
      cd('custom');
      let custom = new Custom('libs', {
        dir: 'libs'
      });
      let results = custom.getPackageInfo('bootstrap');
      expect(results).to.exist();
      expect(results.name).to.be.equal('bootstrap');
    });

    it('should return package info key value if key assigned', () => {
      cd('custom');
      let custom = new Custom('libs', {
        dir: 'libs'
      });
      expect(custom.getPackageInfo('bootstrap', 'name')).to.be.equal('bootstrap');
    });

    it('should return undefined if key not exists', () => {
      cd('custom');
      let custom = new Custom('libs', {
        dir: 'libs'
      });
      expect(custom.getPackageInfo('bootstrap', 'hello')).to.be.equal(undefined);
    });

    it('should return package info when package.json exists', () => {
      cd('custom');
      let custom = new Custom('libs', {
        dir: 'libs'
      });
      expect(custom.getPackageInfo('notie')).to.be.eql({
        name: 'notie',
        author: 'Jared Reich',
        version: '3.9.1',
        main: './dist/notie.min.js',
        license: 'MIT',
        bugs: {
          url: 'https://github.com/jaredreich/notie/issues'
        }
      });
    });

    it('should return null if package not exists', () => {
      cd('custom');
      let custom = new Custom('libs', {
        dir: 'libs'
      });
      let results = custom.getPackageInfo('non-exists');
      expect(results).to.null();
    });
  });
});
