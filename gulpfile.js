'use strict';

var gulp = require('gulp');

var del = require('del');
var addsrc = require('gulp-add-src');
var concat = require('gulp-concat');
var runSequence = require('run-sequence');

// serving
var connect = require('gulp-connect');

// releasing and deploying
var git = require('gulp-git');
var ghPages = require('gulp-gh-pages');
var conventionalGithubReleaser = require('conventional-github-releaser');
var duedateVersion = require('./package.json').version;

// html preprocessing
var htmlmin = require('gulp-htmlmin');
var replace = require('gulp-replace');

// css preprocessing
var csslint = require('gulp-csslint');
var cleanCSS = require('gulp-clean-css');

// js preprocessing
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');

var lib = {
    fonts: [
        'bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.woff2',
    ],
    styles: [
        'bower_components/bootstrap/dist/css/bootstrap.min.css',
        'bower_components/bootstrap-datepicker/dist/css/bootstrap-datepicker3.min.css',
    ],
    scripts: [
        'bower_components/jquery/dist/jquery.min.js',
        'bower_components/bootstrap/dist/js/bootstrap.min.js',
        'bower_components/bootstrap-datepicker/dist/js/bootstrap-datepicker.min.js',
        'bower_components/moment/min/moment.min.js',
        'bower_components/angular/angular.min.js',
    ],
};

gulp.task('clean', function() {
    return del(['dist']);
});

gulp.task('html', function() {
    return gulp.src('src/*.html')
    .pipe(replace('DUEDATE_VERSION', duedateVersion))
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('dist'))
});

gulp.task('fonts', function() {
    return gulp.src(lib.fonts)
    .pipe(gulp.dest('dist/fonts'))
});

gulp.task('styles', function() {
    return gulp.src('src/css/*')
    .pipe(csslint())
    .pipe(csslint.reporter())
    .pipe(cleanCSS())
    .pipe(addsrc.prepend(lib.styles))
    .pipe(concat('duedate.min.css'))
    .pipe(gulp.dest('dist/css'));
});

gulp.task('scripts', function() {
    return gulp.src('src/js/*')
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(uglify())
    .pipe(addsrc.prepend(lib.scripts))
    .pipe(concat('duedate.min.js'))
    .pipe(gulp.dest('dist/js'));
});

gulp.task('watch', function() {
    gulp.watch(['src/*.html'], ['html']);
    gulp.watch(['src/css/*', lib.styles], ['styles']);
    gulp.watch(['src/js/*', lib.scripts], ['scripts']);
});

gulp.task('connect', function() {
    connect.server({root: 'dist'});
});

gulp.task('serve', ['default'], function(cb) {
    return runSequence(['connect', 'watch'], cb);
});

gulp.task('git-tag', function() {
    return git.tag('v'+duedateVersion, function (err) {
        if (err) throw err;
    });
});

gulp.task('git-push', function() {
    return git.push('origin', 'master', function (err) {
        if (err) throw err;
    });
});

gulp.task('github-release', function(done) {
    var githubToken = require('./githubToken.json').token;
    return conventionalGithubReleaser({
        type: "oauth",
        token: githubToken
    }, {
        preset: 'angular'
    }, done);
});

gulp.task('deploy', function() {
    return gulp.src('./dist/**/*')
    .pipe(ghPages());
});

gulp.task('release', ['default'], function(cb) {
    return runSequence(['git-tag', 'git-push', 'github-release', 'deploy']);
});

gulp.task('default', ['clean'], function(cb) {
    return runSequence(['html', 'fonts', 'styles', 'scripts'], cb);
});
