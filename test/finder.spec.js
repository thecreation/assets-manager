import finder from '../lib/finder';
import path from 'path';
import fillTypes from './helpers/fillTypes';
import chai from 'chai';
import dirtyChai from 'dirty-chai';

chai.use(dirtyChai);

const expect = chai.expect;
const FIXTURES = path.join(__dirname, 'fixtures');

describe('finder', function () {
  it('should exists', () => {
    expect(finder).to.exist();
  });

  describe('listFiles()', () => {
    it('should list files', () => {
      const dir = path.resolve(FIXTURES, 'finder');
      const result = finder.listFiles(dir);

      expect(result).to.be.eql([
        'css/bootstrap-theme.css',
        'css/bootstrap-theme.css.map',
        'css/bootstrap-theme.min.css',
        'css/bootstrap-theme.min.css.map',
        'css/bootstrap.css',
        'css/bootstrap.css.map',
        'css/bootstrap.min.css',
        'css/bootstrap.min.css.map',
        'fonts/glyphicons-halflings-regular.eot',
        'fonts/glyphicons-halflings-regular.svg',
        'fonts/glyphicons-halflings-regular.ttf',
        'fonts/glyphicons-halflings-regular.woff',
        'fonts/glyphicons-halflings-regular.woff2',
        'js/bootstrap.js',
        'js/bootstrap.min.js',
        'js/npm.js'
      ]);
    });
  });

  describe('classifyFilesFromGlobs()', () => {
    it('should classify files by type', () => {
      const dir = path.resolve(FIXTURES, 'finder');
      const result = finder.classifyFilesFromGlobs(dir, '**/*.css');
      expect(result).to.be.eql(fillTypes({
        css: [
          'css/bootstrap-theme.css',
          'css/bootstrap-theme.min.css',
          'css/bootstrap.css',
          'css/bootstrap.min.css'
        ]
      }));
    });

    it('should classify files by type', () => {
      const dir = path.resolve(FIXTURES, 'finder');
      const result = finder.classifyFilesFromGlobs(dir, ['**/*.css', '!**/*.min.css']);
      expect(result).to.be.eql(fillTypes({
        css: [
          'css/bootstrap-theme.css',
          'css/bootstrap.css'
        ]
      }));
    });
  });

  describe('classifyFilesFromDir()', () => {
    it('should classify files by type', () => {
      const dir = path.resolve(FIXTURES, 'finder');
      const result = finder.classifyFilesFromDir(dir);
      expect(result).to.be.eql(fillTypes({
        css: [
          'css/bootstrap-theme.css',
          'css/bootstrap-theme.min.css',
          'css/bootstrap.css',
          'css/bootstrap.min.css'
        ],
        js: [
          'js/bootstrap.js',
          'js/bootstrap.min.js',
          'js/npm.js'
        ],
        fonts: [
          'fonts/glyphicons-halflings-regular.eot',
          'fonts/glyphicons-halflings-regular.svg',
          'fonts/glyphicons-halflings-regular.ttf',
          'fonts/glyphicons-halflings-regular.woff',
          'fonts/glyphicons-halflings-regular.woff2'
        ]
      }));
    });

    it('should classify files by type with definations', () => {
      const dir = path.resolve(FIXTURES, 'finder');
      const result = finder.classifyFilesFromDir(dir, {
        css: ['css/*.css', '!css/*.min.css'],
        js: ['js/*.js', '!js/*.min.js']
      });

      expect(result).to.be.eql({
        css: [
          'css/bootstrap-theme.css',
          'css/bootstrap.css'
        ],
        js: [
          'js/bootstrap.js',
          'js/npm.js'
        ]
      });
    });
  });

  describe('classifyFiles()', () => {
    it('should classify files with array by type', () => {
      const files = [
        'dist/js/boostrap.js',
        'dist/css/boostrap.css',
        'dist/css/boostrap.css.map',
        'less/boostrap.less'
      ];
      const result = finder.classifyFiles(files);
      expect(result).to.be.eql(fillTypes({
        js: ['dist/js/boostrap.js'],
        css: ['dist/css/boostrap.css'],
        less: ['less/boostrap.less']
      }));
    });
  });

  describe('filterFiles()', () => {
    it('should filter files correctly', () => {
      const dir = path.resolve(FIXTURES, 'finder');
      const result = finder.filterFiles(dir, 'js/*.js');
      expect(result).to.have.members([
        'js/bootstrap.js',
        'js/bootstrap.min.js',
        'js/npm.js'
      ]);
    });
  });

  describe('filterFilesByType()', () => {
    it('should filter files by type correctly', () => {
      const dir = path.resolve(FIXTURES, 'finder');
      const result = finder.filterFilesByType(dir, 'js');
      expect(result).to.have.members([
        'js/bootstrap.js',
        'js/bootstrap.min.js',
        'js/npm.js'
      ]);
    });
  });
});
