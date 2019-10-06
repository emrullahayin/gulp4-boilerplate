const { src, dest, watch, series } = require("gulp"),
  connect = require("gulp-connect"),
  sass = require("gulp-sass"),
  concat = require("gulp-concat");

function connectServer(cb) {
  connect.server({
    root: "./",
    port: 3000,
    livereload: true
  });
}

function scssConcat() {
  return src("./src/sass/*.scss")
    .pipe(sass().on("error", sass.logError))
    .pipe(concat("main.min.css"))
    .pipe(dest("./build"));
}

exports.default = series(scssConcat, connectServer);
