# assets-manager [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]
>  Assets manager provides a different approach to transfer the required files from your registry distributions to the target.

## Installation

```sh
$ npm install --save-dev assets-manager
```

## Usage

```js
import AssetsManager from 'assets-manager';

const assets = new AssetsManager('./manifest.json');

// copy all packages files to destination
assets.copyPackages();

// clean all packages files from destination
assets.cleanPackages();

// get packages info
assets.getPackagesInfo(['name', 'version', 'license']);

// look all packages
assets.forEachPackage(function(pkg){

});

// loop all js files in the packages
assets.forEachPackage('js', function(pkg, files){

});

// get package handler
const pkg = assets.getPackage('bootstrap');

// get package info
pkg.getInfo();

// get package path
pkg.getPath();

// check if package is installed
pkg.isInstalled();

// get all files in package 
pkg.getFiles();

// get specfic type files in package
pkg.getFilesByType();

// get main files of package
pkg.getMainFiles();
```


## Registries
Assets manager can work with different package manager like **npm**, **bower**. It Also can use custom folders.

Just defined the registries in the manifest.json. The **npm** and **bower** are supported by default, you don't need define them again.

```js
"registries": {
  "vendor": "path-to-vendor",
  "libs": "path-to-lib"
}
```

## Example manifest.json
```js
{
  "cwd": "./",
  "registries": {
    "vendor": "libs"
  },
  "defaultRegistry": "npm",
  "verbose": true,
  "override": true,
  "flattenPackages": true,
  "flattenTypes": false,
  "dest": "assets",
  "dests": {
    "images": "images",
    "fonts": "fonts",
    "js": "js",
    "coffee": "source/coffee",
    "es6": "source/es6",
    "css": "css",
    "stylus": "source/stylus",
    "less": "source/less",
    "sass": "source/sass",
    "scss": "source/scss"
  },
  "packages": {
    "bower:jquery": true,
    "npm:bootstrap": [{
      "js": "dist/js",
      "css": "dist/css",
      "less": "less",
      "fonts": "dist/fonts"
    }, {
      "replace": {
        "*.css": {
          "../fonts": "path-to-fonts"
        }
      }
    }],
    "vendor:modernizr": {
      "modernizr.js": "dist/modernizr.min.js",
    }
  }
}
```

## Global options
### cwd
The relative path to the root of the project.
Defaults to the manifest.json directory.

### flattenPackages
Whether to remove all package path parts from generated dest paths.
Defaults to true.

### flattenTypes
Whether to remove all type path parts from generated dest paths.
Defaults to false.

### verbose
Whether to output copy and clean files infos to console.
Defaults to true.

### override
Whether to override old exists destination files.
Defaults to true.

### defaultRegistry
Set default registry when package dont have a registry specify.
Defaults to npm.

### types
Set types that assets manage will classicfy files automatically.

Defaults:
```js
{
  js: '*.js',
  coffee: '*.coffee',
  es6: '*.es6.js',
  css: '*.css',
  stylus: '*.styl',
  scss: '*.scss',
  sass: '*.sass',
  less: '*.less',
  images: '*.{bmp,jpg,jpeg,png,gif,webp,tiff,wbmp,eps}',
  fonts: '*.{eot,otf,svg,ttc,ttf,woff,woff2}'
}
```

## Packages
### Package key
The package key in the manifest.json take the following form:
```
"registry:package"
"registry:package@version"
"package"
"package@version"
```

The "package" and "package@version" shorter form will use the default registry.

The name of the dependency in the package can be any custom alias, that is then only locally scoped to that specific package.

Typically semver-compatible versions should be used of the form ^x.y.z. Tilde ranges, ~x.y.z are also supported. Ranges without a patch or minor are also supported - x, x.y, ~x.y, ^x.y.

More info about versions:
https://docs.npmjs.com/getting-started/semantic-versioning
https://github.com/npm/node-semver#ranges

### Package definition
You can write in the following ways define the package.

1.simple mode
```js
"PACKAGEKEY": true
```

It will use default types config and use default options.

2.use options only
```js
"PACKAGEKEY": [
  true,
  {
    "registry": "bower"
  }
]
```

It will use default types config and custom options.

3.use types only
```js
"PACKAGEKEY": [{
  "js": "dist/js",
  "css": "dist/css"
}]
```

It will use custom types config and default options.

4.use types only alternatively
```js
"PACKAGEKEY": {
  "js": "dist/js",
  "css": "dist/css"
}
```

5.use types and options
```js
"PACKAGEKEY": [
  {
    "js": "dist/js",
    "css": "dist/css"
  },
  {
    "registry": "bower"
  }
]
```

It will use custom types config and custom options.

### Types config in the package definition

1.Simple path mapping
```js
{
  js: 'path-to-js',
  css: 'path-to-css'
}
```

2.Glob support
```js
{
  js: '*.js',
  css: 'css/*.css'
}
```

3.Array support
```js
{
  js: ['a.js', 'b.js'],
  css: ['css/*.css', '!css/*.min.css']
}
```

4.You can rename the files
```js
js: {
  'bootstrap.js': 'dist/js/bootstrap.js'
},
css: {
  'main.css':'dist/css/bootstrap.css',
  'theme.css':'dist/css/bootstrap-theme.css'
}
```

### Package options
#### defaults
```js
{
  flattenPackages: true,
  flattenTypes: false,
  verbose: true,
  override: true,
  registry: 'npm',
  main: false,
  replaces: {},
  renames: {}
}
```

#### flattenPackages, flattenTypes, verbose, override, registry
These options will override the global options.

#### main
Set to true will use bower/npm's main files.

#### replaces
It will replace the content when copy to target directory. Regex supported.
```js
"replaces": {
  "*.css": {
    "../fonts": "path-to-fonts",
    "/fa-(\w+)/g": "icon-$1"
  }
}
```

#### renames
It will rename the files when copy to target directory. Regex supported.
```js
"renames": {
  "jquery.min.js": "jquery.js",
  "*.min.css": ["/\.min\.css$/", ".css"]
}
```

#### Hooks
Assets manager provides 4 separate hooks that can be used to trigger other automated tools during assets copy or clean operate. 

```
"copy:pre": "<your command here>",
"copy:post": "<your command here>",
"clean:pre": "<your command here>",
"clean:post": "<your command here>",
```

## Todos
-   Hooks
-   Npm package versions
-   File collections
-   Dependencies

## License

MIT © [amazingSurge](amazingSurge.com)

[npm-image]: https://badge.fury.io/js/assets-manager.svg
[npm-url]: https://npmjs.org/package/assets-manager
[travis-image]: https://travis-ci.org/amazingSurge/assets-manager.svg?branch=master
[travis-url]: https://travis-ci.org/amazingSurge/assets-manager
[daviddm-image]: https://david-dm.org/amazingSurge/assets-manager.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/amazingSurge/assets-manager
[coveralls-image]: https://coveralls.io/repos/amazingSurge/assets-manager/badge.svg
[coveralls-url]: https://coveralls.io/r/amazingSurge/assets-manager
