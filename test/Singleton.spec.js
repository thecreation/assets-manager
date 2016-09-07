import {expect} from 'chai';
import Foo from './fixtures/singleton';

describe('Singleton', function () {
  it('Class instance === Class instance', () => {
    expect(Foo.instance === Foo.instance).to.true;
  });

  it('Class instance === new Class', () => {
    expect(Foo.instance === new Foo).to.true;
  });

  it('new Class === new Class', () => {
    expect(new Foo === new Foo).to.true;
  });
});
