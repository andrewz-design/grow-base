const extend = require('deep-extend');
const fs = require('fs');
const {
    dest,
    series,
    parallel,
    src,
    task,
    watch
} = require('gulp');
const gulpAutoprefixer = require('gulp-autoprefixer');
const path = require('path');
const readdirRecursive = require('fs-readdir-recursive');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const browserSync = require('browser-sync').create();

const config = {
    JS_SOURCE_DIR: './source/js/',
    JS_SOURCES: [
        './source/js/**/*.js',
    ],
    JS_OUT_DIR: './dist/js/',
    JS_OPTIONS: {
        uglify: {
            mangle: false
        }
    },
    SASS_SOURCE_DIR: './source/sass/**/*.{sass,scss}',
    SASS_SOURCES: [
        './source/sass/**/*.{sass,scss}',
    ],
    SASS_OUT_DIR: './dist/css/'
};

const jsFiles = readdirRecursive(config.JS_SOURCE_DIR);
const entry = {};
jsFiles.forEach(function(value) {
    if (value.endsWith('.js')) {
        const key = value.substring(0, value.length - 3);
        entry[key] = config.JS_SOURCE_DIR + value;
    }
});

const webpackConfig = {
    entry: entry,
    mode: 'development',
    output: {
        path: path.resolve(__dirname, config.JS_OUT_DIR),
        filename: '[name].min.js'
    }
};

const webpackProdConfig = extend({}, webpackConfig, {
    mode: 'production',
});

const webpackWatchConfig = extend({}, webpackConfig, {
    watch: true,
});

task('compile-js', function() {
    return src(config.JS_SOURCES)
        .pipe(webpackStream(
            webpackProdConfig, webpack
        ))
        .pipe(dest(config.JS_OUT_DIR));
});

task('compile-sass', function(cb) {
    return src(config.SASS_SOURCE_DIR)
        .pipe(sass({
            outputStyle: 'compressed'
        })).on('error', sass.logError)
        .pipe(rename(function(path) {
            path.basename += '.min';
        }))
        .pipe(gulpAutoprefixer())
        .pipe(dest(config.SASS_OUT_DIR));
});

task('watch-sass', function() {
    watch(config.SASS_SOURCES, series('compile-sass'));
});

task('watch-js', function() {
    src(config.JS_SOURCES)
        .pipe(webpackStream(webpackWatchConfig, webpack))
        .pipe(dest(config.JS_OUT_DIR));
});

task('browser-sync', function() {
    browserSync.init({
        proxy: "localhost:8080",
        ui: false,
        ghostMode: false
    });
    watch('./source/').on('change', browserSync.reload);
    watch('./content/').on('change', browserSync.reload);
    watch('./views/').on('change', browserSync.reload);
    watch('./static/').on('change', browserSync.reload);
});

task('grow-build', parallel('compile-js', 'compile-sass'))
    //task('grow-run', parallel('compile-js', 'compile-sass'))

exports.build = parallel('compile-js', 'compile-sass')
exports.default = series(parallel('watch-js', 'watch-sass', 'browser-sync'), 'compile-sass', 'compile-js')