'use strict';
import Registry from '../Registry';
import file from '../file';
import path from 'path';

class Npm extends Registry {
  constructor(options = {}) {
    super(options);

    Object.assign(this.options, {
      json: 'package.json',
      overrides: {},
      dir: 'node_modules'
    }, options);
  }

  getPackageMainFiles(packageName) {
    const info = this.getPackageInfo(packageName);

    if (info && info.main && typeof info.main === 'string') {
      return [info.main];
    }

    return [];
  }

  getPackageInfo(packageName, key) {
    let infoPath = path.join(this.getPackagePath(packageName), this.options.json);
    let info = {};

    if (file.exists(infoPath)) {
      info = file.readJSON(infoPath);
    }

    if (typeof key !== 'undefined') {
      if (Object.hasOwnProperty.call(info, key)) {
        return info[key];
      }
      return undefined;
    }
    return info;
  }

  getPackageInstallCmd(packageName) {
    return `'npm install ${packageName} --save'`;
  }
}

export default Npm;
