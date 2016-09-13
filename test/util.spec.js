"use strict";

import {expect} from 'chai';
import {parseOptions} from '../lib/util';

describe('Util functions', function () {
  describe('parseOptions()', function () {
    it('should parse options correctly', () => {
      let result = parseOptions({
        'dest:js': 'assets/js',
        'dest:css': 'assets/css'
      }, 'dest');
      expect(result).to.be.eql({
        js: 'assets/js',
        css: 'assets/css'
      });
    });

    it('should return {} if no key matched', () => {
      let result = parseOptions({
        'dest:js': 'assets/js',
        'dest:css': 'assets/css'
      }, 'foo');
      expect(result).to.be.eql({});
    });
  });
});
