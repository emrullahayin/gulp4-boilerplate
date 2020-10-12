const gulp = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const browserSync = require('browser-sync').create();
const cache = require('gulp-cache');
const concat = require('gulp-concat');
const cssnano = require('gulp-cssnano');
const del = require('del');
const iconfont = require('gulp-iconfont');
const iconfontCss = require('gulp-iconfont-css');
const imagemin = require('gulp-imagemin');
const uglify = require('gulp-uglify');
const panini = require('panini');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const htmlmin = require('gulp-htmlmin');
const babel = require('gulp-babel');

var reload = browserSync.reload;
var fontName = 'Icons';

// ------------ Development Tasks -------------
// Compile Sass into CSS
function styles() {
  return gulp
    .src(['src/assets/scss/*.scss'])
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        sourceComments: 'map',
        sourceMap: 'sass',
        outputStyle: 'compressed',
      }).on('error', sass.logError)
    )
    .pipe(autoprefixer('last 3 version'))
    .pipe(concat('main.min.css'))
    .pipe(
      cssnano({
        discardComments: { removeAll: true },
      })
    ) // Use cssnano to minify CSS
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('dist/assets/css'))
    .pipe(browserSync.stream());
}

// Using panini, template, page and partial files are combined to form html markup
function compileHtml() {
  return (
    gulp
      .src('src/html/pages/**/*.html')
      .pipe(
        panini({
          root: 'src/html/pages/',
          layouts: 'src/html/layouts/',
          partials: 'src/html/partials/',
        })
      )
      // .pipe(htmlmin({ collapseWhitespace: true }))
      .pipe(gulp.dest('dist'))
  );
}

function resetPages(done) {
  panini.refresh();
  done();
  console.log('Clearing panini cache');
}

// Watches for changes while gulp is running
function watch() {
  // Live reload with BrowserSync
  console.log('watch loading');
  browserSync.init({
    server: './dist',
  });

  gulp.watch(['src/assets/js/**/*.js'], scripts).on('change', reload);
  gulp.watch(['src/assets/scss/**/*'], styles).on('change', reload);
  gulp.watch(['src/assets/icons/*.svg'], iconFonts);
  gulp.watch(['src/assets/img/**/*'], images);
  gulp.watch(['src/assets/video/**/*'], media);
  gulp
    .watch(['src/html/**/*.html'], gulp.series(resetPages, compileHtml))
    .on('change', reload);
  console.log('Watching for changes');
}

// ------------ Optimization Tasks -------------
// Copies image files to dist

function images() {
  return gulp
    .src('src/assets/img/**/*.+(png|jpg|jpeg|gif|svg)')
    .pipe(
      cache(
        imagemin([
          imagemin.gifsicle({ interlaced: true }),
          imagemin.mozjpeg({ quality: 75, progressive: true }),
          imagemin.optipng({ optimizationLevel: 5 }),
          imagemin.svgo({
            plugins: [{ removeViewBox: true }, { cleanupIDs: false }],
          }),
        ])
      )
    ) // Caching images that ran through imagemin
    .pipe(gulp.dest('dist/assets/img/'))
    .pipe(browserSync.stream());
}

function imagesBuild() {
  return gulp
    .src('src/assets/img/**/*.+(png|jpg|jpeg|gif|svg)')
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.mozjpeg({ quality: 75, progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [{ removeViewBox: true }, { cleanupIDs: false }],
        }),
      ])
    )
    .pipe(gulp.dest('dist/assets/img/'));
}
// Copies video assets to dist
function media() {
  return gulp
    .src('src/assets/video/**/*')
    .pipe(gulp.dest('dist/assets/video/'));
}

// Places font files in the dist folder
function font() {
  return gulp
    .src('src/assets/fonts/**/*.+(eot|woff|ttf|otf)')
    .pipe(gulp.dest('dist/assets/fonts'))
    .pipe(browserSync.stream());
}

// Concatenating js files
function scripts() {
  return (
    gulp
      .src(['src/assets/js/**/*.js'])
      // .pipe(sourcemaps.init())
      .pipe(
        babel({
          presets: ['@babel/env'],
        })
      )
      .pipe(uglify())
      .pipe(concat('bundle.js'))
      // .pipe(sourcemaps.write("./"))
      .pipe(gulp.dest('dist/assets/js/'))
      .pipe(browserSync.stream())
  );
}

// Cleaning/deleting files no longer being used in dist folder
async function cleanDist() {
  console.log('Removing old files from dist');
  return del.sync('dist');
}

async function iconFonts() {
  return gulp
    .src(['src/assets/icons/*.svg'], { base: 'src/assets' })
    .pipe(
      iconfontCss({
        fontName: fontName,
        cssClass: 'icon',
        path: 'src/assets/scss/abstracts/_icons.scss',
        targetPath: '../../../src/assets/scss/base/_icons.scss',
        fontPath: '../fonts/',
      })
    )
    .pipe(
      iconfont({
        fontName: fontName,
        normalize: true,
        fontHeight: 1001,
      })
    )
    .pipe(gulp.dest('dist/assets/fonts/'))
    .pipe(browserSync.stream());
}

// ------------ Build Sequence -------------
exports.default = gulp.series(
  cleanDist,
  iconFonts,
  styles,
  font,
  scripts,
  images,
  compileHtml,
  resetPages,
  media,
  watch
);

// Creates production ready assets in dist folder
exports.build = gulp.series(
  cleanDist,
  iconFonts,
  styles,
  gulp.parallel(scripts, imagesBuild, font, compileHtml)
);
