const {
    src,
    dest,
    series,
    parallel,
    watch
} = require("gulp");

const path = require("path-posix");
const sass = require("gulp-sass");
const postCss = require("gulp-postcss");
const clean = require("gulp-clean");
const svgSprite = require("gulp-svg-sprite");
const plumber = require("gulp-plumber");
const browserSync = require("browser-sync").create();
const imagemin = require("gulp-imagemin");
const newer = require("gulp-newer");

const config = {
    path: {
        src: "./src",
        dist: "./public",
        css: "css",
        sass: "scss",
        js: "js",
        mainSassFile: "main.scss",
        images: "images",
        svgSpriteName: "sprite.svg"
    },
    sassOutputStyle: process.env.NODE_ENV === "production" ? "compressed" : "expanded"
};

const aliases = {
    distImagesPath: path.join(config.path.dist, config.path.images),
    distCssPath: path.join(config.path.dist, config.path.css),
    srcImagesPath: path.join(config.path.src, config.path.images),
    srcSassPath: path.join(config.path.src, config.path.sass),
    srcJsPath: path.join(config.path.src, config.path.js),
    distJsPath: path.join(config.path.dist, config.path.js)
};
aliases.mainSassFile = path.join(aliases.srcSassPath, config.path.mainSassFile)

sass.compiler = require("node-sass");

function clear() {
    return src(path.join(aliases.distCssPath, "*.css"), {
        read: false,
        allowEmpty: true
    }).pipe(clean());
}

/*
    TODO: Implement JS processing function
*/

function clearSprites(cb) {
    return src(path.join(
        aliases.distImagesPath,
        config.path.svgSpriteName
    ), {
        read: false,
        allowEmpty: true,
    }).pipe(clean());
}

function svgSprites(cb) {
    return src(path.join(aliases.srcImagesPath, "*.svg"))
        .pipe(plumber())
        .pipe(newer(aliases.distImagesPath))
        .pipe(
            svgSprite({
                mode: {
                    stack: {
                        sprite: path.join("..", config.path.svgSpriteName),
                    },
                },
            })
        )
        .on("error", function (error) {
            console.log(error);
        })
        .pipe(dest(aliases.distImagesPath));
}

function optimizeImages() {
    return src([
            path.join(aliases.srcImagesPath, "*.png"),
            path.join(aliases.srcImagesPath, "*.jpg")
        ])
        .pipe(newer(aliases.distImagesPath))
        .pipe(imagemin())
        .pipe(dest(aliases.distImagesPath));
}

function scss(cb) {
    return src(aliases.mainSassFile)
        .pipe(sass({
            outputStyle: config.sassOutputStyle
        }).on("error", sass.logError))
        .pipe(postCss())
        .pipe(dest(aliases.distCssPath))
        .pipe(browserSync.stream());
}

function scssBuild(cb) {
    return src(aliases.mainSassFile)
        .pipe(sass({
            outputStyle: config.sassOutputStyle
        }).on("error", sass.logError))
        .pipe(postCss())
        .pipe(dest(aliases.distCssPath));
}

function html() {
    return src(path.join(config.path.src, "**/*.html"))
        .pipe(dest(config.path.dist));
}

function serve() {
    browserSync.init({
        server: {
            baseDir: config.path.dist,
        },
    });

    watch(path.join(aliases.srcSassPath, "**/*.scss"), {
        ignoreInitial: false
    }, series(scss));
    watch(path.join(config.path.src, "**/*.html"), {}, series(html)).on("change", browserSync.reload);
    watch(path.join(aliases.srcImagesPath, "*.svg"), {}, series(clearSprites, svgSprite)).on("change", browserSync.reload);
    watch(path.join(aliases.srcImagesPath, "*.{png, jpg}"), {}, series(optimizeImages)).on("change", browserSync.reload);
    watch(path.join(aliases.distJsPath, "*.js")).on("change", browserSync.reload);
}

exports.default = exports.watch = function () {
    watch(path.join(aliases.srcSassPath, "**/*.scss"), {
        ignoreInitial: false
    }, series(clear, scss));
};
exports.build = series(scssBuild, series(clearSprites, svgSprites), optimizeImages);
exports.serve = series(
    series(clearSprites, svgSprites),
    optimizeImages,
    serve
);