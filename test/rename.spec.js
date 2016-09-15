"use strict";

import {expect} from 'chai';
import rename from '../lib/rename';

describe('rename()', () => {
  it('should work with simple name mapping', () => {
    let first = 'foo';
    let second;
    expect(rename('bootstrap.min.js', {
      'bootstrap.min.js': 'bootstrap.js'
    })).to.be.equal('bootstrap.js');
  });

  it('should work with regex', () => {
    let first = 'foo';
    let second;
    expect(rename('bootstrap.min.js', {
      'bootstrap.min.js': ['\.min\.js$', '.js']
    })).to.be.equal('bootstrap.js');
  });

  it('should work with glob', () => {
    let first = 'foo';
    let second;
    expect(rename('bootstrap.min.js', {
      '*.min.js': ['\.min\.js$', '.js']
    })).to.be.equal('bootstrap.js');
  });
});
