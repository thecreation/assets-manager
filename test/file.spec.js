import file from '../lib/file';
import {expect} from 'chai';
import path from 'path';
import cd from './helpers/cd';
import finder from '../lib/finder';

let FIXTURES = path.join(__dirname, 'fixtures');
let TEMP = path.join(__dirname, 'fixtures', '.tmp');


describe('file', function () {
  afterEach(() => {
    cd.reset();
  });

  after(() => {
    // file.remove(TEMP);
  });

  it('should exists', () => {
    expect(file).to.exist;
  });

  it('should return true if path is directory', () => {
    const dir = path.resolve(FIXTURES, 'file');
    expect(file.isDirectory(dir)).to.be.true;
  });

  it('should copy files correctly', () => {
    cd(FIXTURES);

    file.copyFiles([{
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
        'js/test.js',
        'js/test2.js',
        'css/test.css',
        'css/test2.css'
      ]);
    }).catch(error => {
      expect(error).to.be.null;
    });
  });

  it('should clean files correctly', () => {
    cd(FIXTURES);

    file.copyFiles([{
      src: path.join('file', 'test.js'),
      dest: path.join('.tmp', 'clean', 'js' ,'test.js'),
    }]).then(() => {
      expect(finder.listFiles(path.resolve(TEMP, 'clean'))).to.be.eql([
        'js/test.js'
      ]);
      file.cleanFiles([path.resolve(TEMP, 'clean', 'js' ,'test.js')]);
      expect(finder.listFiles(path.resolve(TEMP, 'clean'))).to.be.eql([]);
    }).catch(error => {
      expect(error).to.be.null;
    });
  });
});
