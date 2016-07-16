'use strict';

var gulp = require('gulp');

var del = require('del');
var addsrc = require('gulp-add-src');
var concat = require('gulp-concat');
var runSequence = require('run-sequence');
var connect = require('gulp-connect');
var ghPages = require('gulp-gh-pages');
var git = require('gulp-git');
var conventionalGithubReleaser = require('conventional-github-releaser');
var duedateVersion = require('./package.json').version;
var githubToken = require('./githubToken.json').token;

var htmlmin = require('gulp-htmlmin');
var replace = require('gulp-replace');

var csslint = require('gulp-csslint');
var cleanCSS = require('gulp-clean-css');

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

gulp.task('release', ['default'], function(done) {
    git.tag('v'+duedateVersion, function (err) {
        if (err) throw err;
    });
    conventionalGithubReleaser({
        type: "oauth",
        token: githubToken
    }, {
        preset: 'angular'
    }, done);
    return gulp.src('./dist/**/*')
    .pipe(ghPages());
});

gulp.task('default', ['clean'], function(cb) {
    console.log(githubToken);
    return runSequence(['html', 'fonts', 'styles', 'scripts'], cb);
});
