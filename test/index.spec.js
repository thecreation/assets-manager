import assetsManager from '../lib';
import chai from 'chai';
import dirtyChai from 'dirty-chai';
import Manifest from '../lib/Manifest';

chai.use(dirtyChai);

const expect = chai.expect;

describe('assetsManager', function () {
  it('should exists', () => {
    expect(assetsManager).to.exist();
    expect(assetsManager).to.be.equal(Manifest);
  });
});
