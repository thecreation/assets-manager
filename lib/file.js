'use strict';

import memFs from 'mem-fs';
import editor from 'mem-fs-editor';
import fs from 'fs';

let store = memFs.create();
let file = editor.create(store);

file.isDirectory = function (directory) {
  let exists = true;

  try {
    fs.statSync(directory);
  } catch (e) {
    exists = false;
  }

  return exists;
};

export default file;
