import {expect} from 'chai';
import util from '../lib/util';

describe('Util functions', () => {
  describe('extendVal()', () => {
    it('should use the first value if the second not defined', () => {
      let first = 'foo';
      let second;
      expect(util.extendVal(first, second)).to.be.equal(first);
    });

    it('should use the second value if its defined', () => {
      let first = 'foo';
      let second = 'bar';
      expect(util.extendVal(first, second)).to.be.equal(second);
    })
  });

  describe('parseOptions()', () => {
    it('should parse options correctly', () => {
      let result = util.parseOptions({
        'dest:js': 'assets/js',
        'dest:css': 'assets/css'
      }, 'dest');
      expect(result).to.be.eql({
        js: 'assets/js',
        css: 'assets/css'
      });
    });

    it('should return {} if no key matched', () => {
      let result = util.parseOptions({
        'dest:js': 'assets/js',
        'dest:css': 'assets/css'
      }, 'foo');
      expect(result).to.be.eql({});
    });
  });
});
