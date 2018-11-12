import {expect} from 'chai';
import toRegExp from '../lib/toRegExp';

describe('toRegExp()', () => {
  it('should return null if not a regexp string', () => {
    [
      'hello',
      '^foo',
      'bar$',
      '^foobar$',
      '/var/www',
    ].forEach(function (str) {
      let result = toRegExp(str);
      expect(result).to.be.equal(null);
    });
  });

  it('should convent regexp string to RegExp', () => {
    [
      '/(?:)/',
      '/whatever/',
      '/hello/g',
      '/world/i',
      '/again/m',
      '/^foo/',
      '/bar$/',
      '/^foobar$/'
    ].forEach(function (str) {
      let result = toRegExp(str);
      expect(result).to.be.an.instanceof(RegExp);
      expect(result.toString()).to.be.equal(str);
    });
  });

  it('should convent regexp string to RegExp from RegExp', () => {
    [
      /(?:)/,
      /whatever/,
      /hello/g,
      /world/i,
      /again/gim,
      /^foo/,
      /bar$/,
      /^foobar$/
    ].forEach(function (regex) {
      let str = regex.toString();
      let result = toRegExp(str);
      expect(result).to.be.an.instanceof(RegExp);
      expect(result.toString()).to.be.equal(regex.toString());
    });
  });
});
