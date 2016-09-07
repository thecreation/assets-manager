'use strict';

import assert from 'assert';
import Registry from '../Registry';
import file from '../file';
import path from 'path';
import configure from '../configure';

class Custom extends Registry {
  constructor(name, options = {}) {
    super(options);

    Object.assign(this.options, {
      json: 'package.json',
      dir: configure.get(`registry.${name}.dir`, null),
      overrides: {}
    }, options);

    assert(
      (this.options.dir !== null),
      'options.dir must not be empty'
    );

    this.name = name;
  }

  getPackageInfo(packageName, key) {
    let packagePath = this.getPackagePath(packageName);

    if (!file.isDirectory(packagePath)) {
      return null;
    }

    let infoPath = path.join(packagePath, this.options.json);
    let info = null;

    if (file.exists(infoPath)) {
      info = file.readJSON(infoPath);
    } else {
      info = {
        name: packageName
      };
    }

    if (info && typeof key !== 'undefined') {
      if (Object.hasOwnProperty.call(info, key)) {
        return info[key];
      } else {
        return undefined;
      }
    } else {
      return info;
    }
  }
}

export default Custom;
