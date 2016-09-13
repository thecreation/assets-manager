"use strict";

import Foo from './fixtures/singleton';
import chai from 'chai';
import dirtyChai from 'dirty-chai';

chai.use(dirtyChai);

const expect = chai.expect;

describe('Singleton', function () {
  it('Class instance === Class instance', () => {
    expect(Foo.instance === Foo.instance).to.true();
  });

  it('Class instance === new Class', () => {
    expect(Foo.instance === new Foo()).to.true();
  });

  it('new Class === new Class', () => {
    expect(new Foo() === new Foo()).to.true();
  });
});
