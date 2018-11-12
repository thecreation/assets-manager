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
    let packagePath = this.getRelativePackagePath(packageName);

    if (!file.isDirectory(packagePath)) {
      return {};
    }

    let infoPath = path.join(packagePath, this.options.json);
    let info = {};

    if (file.exists(infoPath)) {
      info = file.readJSON(infoPath);
    } else {
      info = {
        name: packageName
      };
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
    let packagePath = this.getRelativePackagePath(packageName);
    return `check ${packagePath} path`;
  }
}

export default Custom;
