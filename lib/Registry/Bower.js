'use strict';
import Registry from '../Registry';
import BowerConfig from 'bower-config';
import untildify from 'untildify';
import file from '../file';
import path from 'path';

class Bower extends Registry {
  constructor(options = {}) {
    super(options);

    Object.assign(this.options, {
      json: 'bower.json',
      overrides: {},
      componentJson: '.bower.json'
    }, options);

    if (!this.options.dir) {
      var bowerrc = new BowerConfig(this.options.cwd).load().toObject();
      this.options.cwd = untildify(bowerrc.cwd);
      this.options.dir = untildify(bowerrc.directory);
    }
  }

  getPackageInfo(packageName, key) {
    let infoPath = path.join(this.getPackagePath(packageName), this.options.componentJson);
    if (!file.exists(infoPath)) {
      infoPath = path.join(this.getPackagePath(packageName), this.options.json);
    }

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
}

export default Bower;
