const {parallel} = require("gulp");

function javascript(cb) {
    cb();
}

function css(cb){
    cb();
}


exports.default = series(javascript,css);