var gulp = require('gulp'),
  pump = require('pump'),
  plugins = require('gulp-load-plugins')({
  }),
  package_json = require('./package.json'),
  copyrightHeader = require('./src/copyright.json'),
  version,
  build_date,
  year,
  paths = {
    jsSrc: {
      core: 'src/headline-fader.js',
    },
    baseDest: 'dist/',
  };

(function () {
  var d = new Date();

  year = d.getFullYear();
  build_date = year + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}());

version = package_json.version;

gulp.task('clean-dist', function() {
  return gulp.src(paths.baseDest, {read: false})
    .pipe(plugins.clean());
});

gulp.task('lint', function() {
  var eslintRules = {
    'array-bracket-spacing': ['error', 'never'],
    'block-scoped-var': ['error'],
    'brace-style': ['error', '1tbs'],
    'comma-dangle': ['error', 'always-multiline'],
    'comma-spacing': 'error',
    'comma-style': 'error',
    'computed-property-spacing': 'error',
    'consistent-this': ['error', 'that'],
    'curly': 'error',
    'dot-notation': 'error',
    'eqeqeq': 'error',
    'func-call-spacing': 'error',
    'func-style': ['error', 'expression'],
    'guard-for-in': 'error',
    'indent': ['error', 2],
    'key-spacing': 'error',
    'keyword-spacing': ['error'],
    'new-cap': 'error',
    'new-parens': 'error',
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-div-regex': 'error',
    'no-else-return': 'warn',
    'no-extra-bind': 'error',
    'no-floating-decimal': 'error',
    'no-global-assign': 'error',
    'no-implicit-globals': 'error',
    'no-implied-eval': 'error',
    'no-loop-func': 'error',
    'no-multi-spaces': 'error',
    'no-multi-str': 'error',
    'no-native-reassign': 'error',
    'no-nested-ternary': 'warn',
    'no-new-func': 'error',
    'no-new-object': 'error',
    'no-new-wrappers': 'error',
    'no-plusplus': 'error',
    'no-restricted-syntax': ['error', 'WithStatement'],
    'no-return-assign': 'error',
    'no-script-url': 'error',
    'no-self-compare': 'error',
    'no-template-curly-in-string': ['error'],
    'no-trailing-spaces': ['error'],
    'no-unmodified-loop-condition': 'error',
    'no-unsafe-negation': ['error'],
    'no-unused-expressions': 'error',
    'no-use-before-define': 'error',
    'no-useless-concat': 'error',
    'no-void': 'error',
    'no-warning-comments': 'warn',
    'no-with': 'error',
    'object-curly-spacing': ['error', 'never'],
    'radix': 'error',
    'semi': ['error', 'always'],
    'space-infix-ops': 'error',
    'space-unary-ops': 'error',
    'strict': ['warn', 'function'],
    'vars-on-top': 'warn',
    'wrap-iife': ['error', 'outside'],
    'quotes': ['warn', 'single', 'avoid-escape'],
  };

  return gulp.src(paths.jsSrc.core)
    .pipe(plugins.cached('lint'))
    .pipe(plugins.eslint(
      {
        extends: 'eslint:recommended',
        parserOptions: {
          ecmaVersion: 6,
        },
        rules: eslintRules,
        env: {
          browser: true
        }
      }
    ))
    .pipe(plugins.eslint.format());
});

var minify = function (src) {

  return pump(
    [
      src,
      plugins.cached('minify'),
      plugins.babel({
        comments: false, // There seems to be some sort of conflict between
                         // babel and uglify that is causing uglify to drop the license
                         // comment event though babel was keeping it. I think it might
                         // be related to optimizations that drop whole nodes when parsing
                         // the JS as mentioned in the comments section of http://lisperator.net/uglifyjs/codegen
                         // babel is shoving a file-wide 'use strict'; at the top of its output
                         // I think that might be what is causing the issue.
        presets: ['es2015'],
        plugins: ['transform-remove-console']
      }),
      plugins.uglify({
        //preserveComments: 'license'
      }),

      // hack to load in a copyright header because of aforementioned
      // problems getting uglify to not drop them
      plugins.insert.transform(function (contents, file) {
        return copyrightHeader.text + contents;
      }),

      plugins.replace('%version%', version),
      plugins.replace('%build_date%', build_date),
      plugins.replace('%year%', year),

      plugins.rename('headline-fader_' + version + '.min.js'),
      gulp.dest(paths.baseDest),
    ], function(err) {
      console.log('pipe finished', err)
  });

};

gulp.task('minify', ['clean-dist', 'lint'], function() {
  return minify(gulp.src(paths.jsSrc.core));
});


gulp.task('gz', ['clean-dist', 'lint'], function() {
  return minify(gulp.src(paths.jsSrc.core))
    .pipe(plugins.cached('gz'))
    .pipe(plugins.gzip())
    .pipe(gulp.dest(paths.baseDest));
});

gulp.task('watch', function() {
  var watcher = gulp.watch([paths.jsSrc.core], ['lint']);
  watcher.on('change', function(event) {
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
  });
});

gulp.task('default', ['minify']);
