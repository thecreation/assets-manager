import configure from '../lib/configure';
import chai from 'chai';
import dirtyChai from 'dirty-chai';

chai.use(dirtyChai);

const expect = chai.expect;

describe('configure', function () {
  afterEach(() => {
    configure.clear();
  });

  it('should exists', () => {
    expect(configure).to.exist();
  });

  it('should set() and get() correctly', () => {
    configure.set('foo', 'bar');
    configure.set('baz.boo', true);
    expect(configure.get('foo')).to.be.equal('bar');
    expect(configure.get('baz.boo')).to.be.equal(true);
  });

  it('should get default value if key not exist', () => {
    expect(configure.get('foo')).to.be.equal(undefined);
    expect(configure.get('foo', 'bar')).to.be.equal('bar');
    expect(configure.get('foo', null)).to.be.equal(null);
  });

  it('should set() and get() object correctly', () => {
    configure.set({
      foo1: 'bar1',
      foo2: 'bar2',
      baz: {
        boo: 'foo',
        foo: {
          bar: 'baz'
        }
      }
    });
    expect(configure.get('foo1')).to.be.equal('bar1');
    expect(configure.get('foo2')).to.be.equal('bar2');
    expect(configure.get('baz')).to.be.eql({
      boo: 'foo',
      foo: {
        bar: 'baz'
      }
    });

    expect(configure.get('baz.boo'), 'foo');
    expect(configure.get('baz.foo')).to.be.eql({bar: 'baz'});
    expect(configure.get('baz.foo.bar'), 'baz');
  });

  it('should returns true if given variable is set in configure with has()', () => {
    configure.set('foo', '🦄');
    configure.set('baz.boo', '🦄');

    expect(configure.has('foo')).to.be.true();
    expect(configure.has('baz.boo')).to.be.true();
    expect(configure.has('missing')).to.be.false();
  });

  it('should delete a variable from configure correctly', () => {
    configure.set('foo', 'bar');
    configure.set('baz.boo', true);
    configure.set('baz.foo.bar', 'baz');
    configure.delete('foo');
    expect(configure.get('foo')).not.equal('bar');

    configure.delete('baz.boo');
    expect(configure.get('baz.boo')).not.equal(true);

    configure.delete('baz.foo');
    expect(configure.get('baz.foo')).not.eql({bar: 'baz'});

    configure.set('foo.bar.baz', {awesome: 'icecream'});
    configure.set('foo.bar.zoo', {awesome: 'redpanda'});
    configure.delete('foo.bar.baz');
    expect(configure.get('foo.bar.zoo.awesome')).to.be.equal('redpanda');
  });

  it('should clear all values stored in configure with clear()', () => {
    configure.set('foo', 'bar');
    configure.set('foo1', 'bar1');
    configure.set('baz.boo', true);
    configure.clear();
    expect(configure.size()).to.be.equal(0);
  });

  describe('all()', function () {
    it('should set values with all(values)', () => {
      let values = {
        boo: 'foo',
        foo: {
          bar: 'baz'
        }
      };

      configure.all(values);
      expect(configure.all()).to.be.eql(values);
    });

    it('should return all defineds with all()', () => {
      configure.set('foo', 'bar');
      configure.set('baz.boo', true);

      let all = configure.all();
      expect(all).to.be.eql({
        foo: 'bar',
        baz: {
          boo: true
        }
      });

      expect(all.foo).to.be.equal('bar');
      expect(all.baz).to.be.eql({boo: true});
    });
  });
});
