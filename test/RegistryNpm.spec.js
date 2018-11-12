import Npm from '../lib/Registry/Npm';
import path from 'path';
import cd from './helpers/cd';
import fillTypes from './helpers/fillTypes';
import chai from 'chai';
import dirtyChai from 'dirty-chai';

chai.use(dirtyChai);

const expect = chai.expect;
const FIXTURES = path.join(__dirname, 'fixtures');

describe('Npm Registry', () => {
  afterEach(() => {
    cd.reset();
  });

  it('should exists', () => {
    const npm = new Npm();
    expect(npm).to.exist();
  });

  it('should set npm configurations', () => {
    cd('npm');
    let npm = new Npm();

    expect(npm.options).to.be.eql({
      cwd: path.resolve(FIXTURES, 'npm'),
      json: 'package.json',
      dir: 'node_modules',
      overrides: {}
    });
  });

  it('should fail if cwd isn\'t absolute', () => {
    cd('npm');
    let npm;
    let error;
    try {
      npm = new Npm({
        cwd: 'npm'
      });
    } catch (err) {
      error = err;
    }
    expect(npm).to.be.equal(undefined);
    expect(error).to.be.instanceOf(Error);
  });

  it('should respect given dir option', () => {
    cd('npm');

    let npm = new Npm({dir: 'components'});
    expect(npm.options).to.be.eql({
      cwd: path.resolve(FIXTURES, 'npm'),
      json: 'package.json',
      dir: 'components',
      overrides: {}
    });
  });

  it('should return package path', () => {
    cd('npm');

    let npm = new Npm();
    expect(npm.getPackagePath('bootstrap')).to.be.eql(
      path.join('node_modules', 'bootstrap')
    );
  });

  describe('getPackageInfo()', () => {
    it('should return package info', () => {
      cd('npm');

      let npm = new Npm();
      let results = npm.getPackageInfo('bootstrap');
      expect(results).to.exist();
      expect(results.name).to.be.equal('bootstrap');
    });

    it('should return package info key value if key assigned', () => {
      cd('npm');

      let npm = new Npm();
      expect(npm.getPackageInfo('bootstrap', 'name')).to.be.equal('bootstrap');
    });

    it('should return undefined if key not exists', () => {
      cd('npm');

      let npm = new Npm();
      expect(npm.getPackageInfo('bootstrap', 'hello')).to.be.equal(undefined);
    });

    it('should return empty object if package not exists', () => {
      cd('npm');

      let npm = new Npm();
      let results = npm.getPackageInfo('non-exists');
      expect(results).to.be.eql({});
    });
  });

  it('should return package files', () => {
    cd('npm');

    let npm = new Npm();
    expect(npm.getPackageFiles('normalize.css')).to.have.members([
      'CHANGELOG.md',
      'LICENSE.md',
      'normalize.css',
      'package.json',
      'README.md'
    ]);
  });

  it('should return typed files', () => {
    cd('npm');

    let npm = new Npm();
    expect(npm.getPackageTypedFiles('notie')).to.be.eql(fillTypes({
      js: ['gulpfile.js', 'dist/notie.min.js', 'src/notie.js'],
      css: ['dist/notie.css'],
      scss: ['src/notie.scss'],
      images: ['demo.gif']
    }));
  });

  describe('getPackageMainFiles()', () => {
    it('should return main files', () => {
      cd('npm');

      let npm = new Npm();
      expect(npm.getPackageMainFiles('jquery')).to.be.eql([
        'dist/jquery.js'
      ]);
    });

    it('should return main files with empty array if package not exists', () => {
      cd('npm');

      let npm = new Npm();
      let results = npm.getPackageMainFiles('non-exists');
      expect(results).to.be.eql([]);
    });

    it('should convent single main file to array', () => {
      cd('npm');

      let npm = new Npm();
      expect(npm.getPackageMainFiles('jquery')).to.be.eql([
        'dist/jquery.js'
      ]);
    });
  });
});
