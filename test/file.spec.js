/*eslint max-nested-callbacks: ["error", 6]*/
"use strict";

import file from '../lib/file';
import path from 'path';
import fs from 'fs-extra';
import cd from './helpers/cd';
import finder from '../lib/finder';
import chai from 'chai';
import dirtyChai from 'dirty-chai';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';
import sinon from 'sinon';

chai.use(chaiAsPromised);
chai.use(dirtyChai);
chai.use(sinonChai);

const expect = chai.expect;
const FIXTURES = path.join(__dirname, 'fixtures');
const TEMP = path.join(__dirname, 'fixtures', '.tmp');


describe('file', () => {
  afterEach(() => {
    cd.reset();
  });

  after(() => {
    file.remove(TEMP);
  });

  it('should exists', () => {
    expect(file).to.exist();
  });

  describe('write()', () => {
    it('should write content to a file', () => {
      cd(TEMP);
      let filepath = 'test.txt';
      let content = 'hello world';

      return file.write(filepath, content).then(()=>{
        expect(file.exists(filepath)).to.be.true();

        return file.read(filepath).then(c => {
          expect(c.toString()).to.be.equal(content);
        });
      });
    });

    it('should work with full path', () => {
      cd(TEMP);
      let filepath = path.resolve(TEMP, 'test.txt');
      let content = 'hello world';

      return file.write(filepath, content).then(()=>{
        expect(file.exists(filepath)).to.be.true();

        return file.read(filepath).then(c => {
          expect(c.toString()).to.be.equal(content);
        });
      });
    });

    it('should override the exists file', () => {
      cd(TEMP);
      let filepath = 'test.txt';
      let content = 'hello world';

      return file.write(filepath, 'init content').then(()=>{
        return file.write(filepath, content).then(()=>{
          return file.read(filepath).then(c => {
            expect(c.toString()).to.be.equal(content);
          });
        });
      });
    });
  });

  describe('remove()', () => {
    it('should remove a file', () => {
      cd(TEMP);
      let filepath = 'test.txt';

      return file.write(filepath, 'hello world').then(()=>{
        expect(file.exists(filepath)).to.be.true();

        return file.remove(filepath).then(() => {
          expect(file.exists(filepath)).to.be.false();
        });
      });
    });

    it('should work with full path', () => {
      cd(TEMP);
      let filepath = path.resolve(TEMP, 'test.txt');

      return file.write(filepath, 'hello world').then(()=>{
        expect(file.exists(filepath)).to.be.true();

        return file.remove(filepath).then(() => {
          expect(file.exists(filepath)).to.be.false();
        });
      });
    });
  });

  describe('read()', () => {
    it('should read content of a file', () => {
      cd(FIXTURES);
      let filepath = path.join('file', 'read.txt');

      return file.read(filepath).then(content => {
        expect(content.toString()).to.contain('hello world');
      });
    });

    it('should work with full path', () => {
      cd(FIXTURES);
      let filepath = path.resolve(FIXTURES, 'file', 'read.txt');

      return file.read(filepath).then(content => {
        expect(content.toString()).to.contain('hello world');
      });
    });
  });

  describe('replace()', () => {
    it('should replace content of a file and save to another file', () => {
      cd(FIXTURES);
      let src = path.join('.tmp', 'from.txt');
      let dest = path.join('.tmp', 'replace.txt');
      let content = `hello world
abcd1234
efgh5678`;

      return file.write(src, content).then(() => {
        return file.replace(src, dest, {
          'hello': 'foo',
          'world': 'bar',
          '/([a-z]+)([0-9]+)/g': '$2$1'
        }).then(() => {
          return file.read(dest).then(content => {
            content = content.toString();

            expect(content).to.contain('foo bar');
            expect(content).to.contain('1234abcd');
            expect(content).to.contain('5678efgh');
          });
        });
      });
    });
  });


  describe('locate()', () => {
    it('should work with relative directory', () => {
      cd(FIXTURES);

      expect(file.locate('file')).to.be.equal(path.resolve(FIXTURES, 'file'));
    });

    it('should work with full path', () => {
      expect(file.locate(path.resolve(FIXTURES, 'file'))).to.be.equal(path.resolve(FIXTURES, 'file'));
    });
  });

  describe('exists()', () => {
    it('should work with relative directory', () => {
      cd(FIXTURES);

      expect(file.exists('file')).to.be.false();
      expect(file.exists(path.join('file', 'test.js'))).to.be.true();
      expect(file.exists('non-exist')).to.be.false();
    });

    it('should work with full path', () => {
      expect(file.exists(path.resolve(FIXTURES, 'file', 'test.js'))).to.be.true();
    });
  });

  describe('isDirectory()', () => {
    it('should return true if path is directory', () => {
      const dir = path.resolve(FIXTURES, 'file');
      expect(file.isDirectory(dir)).to.be.true();
    });

    it('should work with relative directory', () => {
      cd(FIXTURES);

      expect(file.isDirectory('file')).to.be.true();
      expect(file.isDirectory(path.join('file', 'directory'))).to.be.true();
      expect(file.isDirectory(path.join('file', 'test.js'))).to.be.false();
      expect(file.isDirectory('non-exist')).to.be.false();
    });

    it('should work with full path', () => {
      expect(file.isDirectory(path.resolve(FIXTURES, 'file'))).to.be.true();
    });
  });

  describe('readJSON()', () => {
    it('should read json correctly', () => {
      const jsonfile = path.resolve(FIXTURES, 'file', 'test.json');
      expect(file.readJSON(jsonfile)).to.be.eql({
        test: true
      });
    });

    it('should use default value when json file not exist', () => {
      const jsonfile = path.resolve(FIXTURES, 'file', 'non-exist.json');
      const def = {
        test: true
      };
      expect(file.readJSON(jsonfile, def)).to.be.eql(def);
    });

    it('should fail when read json error', () => {
      const jsonfile = path.resolve(FIXTURES, 'file', 'error.json');
      let error;

      try {
        file.readJSON(jsonfile);
      } catch (err) {
        error = err;
      }
      expect(error).to.be.instanceOf(Error);
    });
  });

  it('should copy and clean files with single filepath', () => {
    cd(FIXTURES);

    return file.copyFiles({
      src: path.join('file', 'test.js'),
      dest: path.join('.tmp', 'clean', 'js' ,'test.js'),
    }).then(() => {
      expect(finder.listFiles(path.resolve(TEMP, 'clean'))).to.be.eql([
        'js/test.js'
      ]);
      return file.cleanFiles(path.resolve(TEMP, 'clean', 'js' ,'test.js')).then(()=>{
        expect(finder.listFiles(path.resolve(TEMP, 'clean'))).to.be.eql([]);
      });
    });
  });

  describe('copyFiles()', () => {
    it('should copy files correctly', () => {
      cd(FIXTURES);

      return file.copyFiles([{
        src: path.join('file', 'test.js'),
        dest: path.join('.tmp', 'copy', 'js' ,'test.js'),
      }, {
        src: path.join('file', 'test.css'),
        dest: path.join('.tmp', 'copy', 'css' ,'test.css'),
      }, {
        src: path.join('file', 'sub', 'test2.js'),
        dest: path.join('.tmp', 'copy', 'js' ,'test2.js'),
      }, {
        src: path.join('file', 'sub', 'test2.css'),
        dest: path.join('.tmp', 'copy', 'css' ,'test2.css'),
      }]).then(() => {
        expect(finder.listFiles(path.resolve(TEMP, 'copy'))).to.be.eql([
          'css/test.css',
          'css/test2.css',
          'js/test.js',
          'js/test2.js'
        ]);
      });
    });

    it('should replaces based on rules', () => {
      cd(FIXTURES);

      return file.copyFiles([{
        src: path.join('file', 'sub', 'test2.js'),
        dest: path.join('.tmp', 'replaces', 'js' ,'test2.js'),
      }], {
        replaces: {
          "*": {
            "foo": "bar"
          },
          "*.js": {
            "hello": "world"
          }
        }
      }).then(() => {
        return file.read(path.join('.tmp', 'replaces', 'js' ,'test2.js')).then(c => {
          expect(c.toString()).to.contain("bar");
          expect(c.toString()).to.contain("world");
        });
      });
    });

    it('should fail if copy files not correctly', () => {
      cd(FIXTURES);

      return file.copyFiles([{
        src: path.join('file', 'non-exist.js'),
        dest: path.join('.tmp', 'non-exist.js'),
      }]).catch(error => {
        expect(error).to.exist();
        expect(error).to.contain('Cannot copy');
      });
    });

    it('should keep old files when options.override = false', () => {
      cd(FIXTURES);

      return file.copyFiles([{
        src: path.join('file', 'override', 'a.txt'),
        dest: path.join('.tmp', 'override.txt'),
      }]).then(() => {
        return file.copyFiles([{
          src: path.join('file', 'override', 'b.txt'),
          dest: path.join('.tmp', 'override.txt'),
        }], {
          override: false
        }).then(() => {
          expect(fs.readFileSync(path.resolve(TEMP, 'override.txt')).toString()).to.be.equal(fs.readFileSync(path.join('file', 'override', 'a.txt')).toString());
        });
      });
    });

    it('should override old files when options.override = true', () => {
      cd(FIXTURES);

      return file.copyFiles([{
        src: path.join('file', 'override', 'a.txt'),
        dest: path.join('.tmp', 'override.txt'),
      }]).then(() => {
        return file.copyFiles([{
          src: path.join('file', 'override', 'b.txt'),
          dest: path.join('.tmp', 'override.txt'),
        }], {
          override: true
        }).then(() => {
          expect(fs.readFileSync(path.resolve(TEMP, 'override.txt')).toString()).to.be.equal(fs.readFileSync(path.join('file', 'override', 'b.txt')).toString());
        });
      });
    });

    it('should log files copy when options.verbose = true', () => {
      cd(FIXTURES);
      let log = {
        info: sinon.spy()
      };

      return file.copyFiles([{
        src: path.join('file', 'test.js'),
        dest: path.join('.tmp', 'copy', 'js' ,'test.js'),
      }], {
        verbose: true,
        log: log.info
      }).then(() => {
        expect(log.info).to.be.calledOnce();
      });
    });

    it('should not log files copy when options.verbose = false', () => {
      cd(FIXTURES);
      let log = {
        info: sinon.spy()
      };

      return file.copyFiles([{
        src: path.join('file', 'test.js'),
        dest: path.join('.tmp', 'copy', 'js' ,'test.js'),
      }], {
        verbose: false,
        log: log.info
      }).then(() => {
        expect(log.info).to.not.be.called();
      });
    });
  });

  describe('cleanFiles()', () => {
    it('should clean files correctly', () => {
      cd(FIXTURES);

      return file.copyFiles([{
        src: path.join('file', 'test.js'),
        dest: path.join('.tmp', 'clean', 'js' ,'test.js'),
      }]).then(() => {
        expect(finder.listFiles(path.resolve(TEMP, 'clean'))).to.be.eql([
          'js/test.js'
        ]);
        return file.cleanFiles([path.resolve(TEMP, 'clean', 'js', 'test.js')]).then(()=>{
          expect(finder.listFiles(path.resolve(TEMP, 'clean'))).to.be.eql([]);
        });
      });
    });

    it('should fail if files not exists when options.ignoreError = false', () => {
      cd(FIXTURES);

      return file.cleanFiles([{
        src: path.join('file', 'non-exist.js'),
        dest: path.join('.tmp', 'non-exist.js'),
      }], {
        ignoreError: false
      }).catch(error => {
        expect(error).to.exist();
        expect(error).to.contain('Cannot clean');
      });
    });

    it('should not fail if files not exists when options.ignoreError = true', () => {
      cd(FIXTURES);

      return file.cleanFiles([{
        src: path.join('file', 'non-exist.js'),
        dest: path.join('.tmp', 'non-exist.js'),
      }], {
        ignoreError: true
      }).catch(error => {
        expect(error).to.not.exist();
      });
    });

    it('should log files cleaned when options.verbose = true', () => {
      cd(FIXTURES);
      let log = {
        info: sinon.spy()
      };

      return file.cleanFiles([{
        src: path.join('file', 'test.js'),
        dest: path.join('.tmp', 'copy', 'js' ,'test.js'),
      }], {
        verbose: true,
        log: log.info
      }).then(() => {
        expect(log.info).to.be.calledOnce();
      });
    });

    it('should not log files cleaned when options.verbose = false', () => {
      cd(FIXTURES);
      let log = {
        info: sinon.spy()
      };

      return file.cleanFiles([{
        src: path.join('file', 'test.js'),
        dest: path.join('.tmp', 'copy', 'js' ,'test.js'),
      }], {
        verbose: false,
        log: log.info
      }).then(() => {
        expect(log.info).to.not.be.called();
      });
    });
  });

  describe('matchGlob()', () => {
    it('should return the matched glob with filepath from globs', () => {
      expect(file.matchGlob('path/to/file.js', 'another/**/*.css')).to.be.equal(false);
      expect(file.matchGlob('path/to/file.js', 'path/**/*')).to.be.equal('path/**/*');
      expect(file.matchGlob('path/to/file.js', ['path/**/*'])).to.be.equal('path/**/*');
      expect(file.matchGlob('path/to/file.js', ['path/**/*', 'path/**/*.js'])).to.be.equal('path/**/*');
      expect(file.matchGlob('path/to/file.js', ['path/**/*', 'path/**/*.css'])).to.be.equal('path/**/*');
      expect(file.matchGlob('path/to/file.js', ['path/**/*.css', 'path/**/*'])).to.be.equal('path/**/*');
      expect(file.matchGlob('path/to/file.js', ['path/**/*.css', 'path/**/*.scss'])).to.be.equal(false);
    });
  });

  describe('getRelativeFromGlobs()', () => {
    it('should return the relative filepath with filepath from globs', () => {
      expect(file.getRelativeFromGlobs('path/to/file.js', 'another/**/*.css')).to.be.equal('file.js');
      expect(file.getRelativeFromGlobs('path/to/file.js', '**/*')).to.be.equal('path/to/file.js');
      expect(file.getRelativeFromGlobs('path/to/file.js', 'path/**/*')).to.be.equal('to/file.js');
      expect(file.getRelativeFromGlobs('path/to/file.js', 'path/to/**/*')).to.be.equal('file.js');

      expect(file.getRelativeFromGlobs('path/to/file.js', ['path/**/*'])).to.be.equal('to/file.js');
    });
  });
});
