/*eslint no-useless-escape: "off"*/
"use strict";

import {expect} from 'chai';
import rename from '../lib/rename';

describe('rename()', () => {
  it('should work with simple name mapping', () => {
    expect(rename('bootstrap.min.js', {
      'bootstrap.min.js': 'bootstrap.js'
    })).to.be.equal('bootstrap.js');
  });

  it('should work with regex', () => {
    expect(rename('bootstrap.min.js', {
      'bootstrap.min.js': ['/\.min\.js$/', '.js']
    })).to.be.equal('bootstrap.js');
  });

  it('should work with glob', () => {
    expect(rename('bootstrap.min.js', {
      '*.min.js': ['/\.min\.js$/', '.js']
    })).to.be.equal('bootstrap.js');
  });

  it('should work with path', () => {
    expect(rename('js/bootstrap.min.js', {
      'bootstrap.min.js': 'bootstrap.js'
    })).to.be.equal('js/bootstrap.js');
  });
});
