import path from 'path';
const originalDir = process.cwd();

const fixturesDir = path.resolve(__dirname, '..', 'fixtures');
let current = originalDir;

function cd(dir) {
  current = path.resolve(fixturesDir, dir);
  process.chdir(current);
}

cd.reset = cd.bind(null, originalDir);

export default cd;
