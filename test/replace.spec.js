"use strict";

import {expect} from 'chai';
import replace from '../lib/replace';

describe('replace()', () => {
  let content = 'hello world';
  it('should work with simple string mapping', () => {
    expect(replace(content, {
      hello: 'foo',
      world: 'bar'
    })).to.be.equal('foo bar');
  });

  it('should work with regex', () => {
    expect(replace('abcd1234 efgh5678', {
      '/([a-z]+)(\\d+)/g': '$2$1'
    })).to.be.equal('1234abcd 5678efgh');
  });
});
