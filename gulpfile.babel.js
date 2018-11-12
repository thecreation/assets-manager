const path = require('path');
const { series, src, dest, watch } = require('gulp');
const eslint = require('gulp-eslint');
const excludeGitignore = require('gulp-exclude-gitignore');
const mocha = require('gulp-mocha');
const istanbul = require('gulp-istanbul');
const plumber = require('gulp-plumber');
const babel = require('gulp-babel');
const del = require('delete');
const isparta = require('isparta');

function lint() {
  return src(['lib/**/*.js', 'test/**/*.js', '!test/fixtures/**/*'])
    .pipe(excludeGitignore())
    .pipe(eslint({
      fix: true
    }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}

exports.lint = lint;

function pretest() {
  return src('lib/**/*.js')
    .pipe(excludeGitignore())
    .pipe(istanbul({
      includeUntested: true,
      instrumenter: isparta.Instrumenter
    }))
    .pipe(istanbul.hookRequire());
}
exports.pretest = pretest

function test(cb)  {
  var mochaErr;

  return src('test/*.spec.js')
    .pipe(plumber())
    .pipe(mocha({
      reporter: 'spec',
      compilers: 'js:@babel/register'
    }))
    .on('error', function (err) {
      mochaErr = err;
    })
    .on('end', function () {
      cb(mochaErr);
    });
}
exports.test = test;

exports.watch = function() {
  watch(['lib/**/*.js', 'test/**'], { delay: 500 }, test);
}

function build() {
  return src('lib/**/*.js')
    .pipe(babel())
    .pipe(dest('dist'));
};

exports.build = build;

function clean(cb) {
  del(['dist'], cb);
}
exports.clean = clean;

exports.prepublish = series(clean, build);
exports.default = series(lint, test);
