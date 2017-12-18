const gulp = require("gulp")
const babel = require("gulp-babel")
const connect = require("gulp-connect")
const concat = require("gulp-concat")
const less = require("gulp-less")
const templatecache = require("gulp-angular-templatecache")
const del = require("del")
const gutil = require("gulp-util")
const remember = require("gulp-remember")
const cache = require("gulp-cached")
const eslint = require("gulp-eslint")
const filter = require("gulp-filter")
const sequence = require("gulp-sequence")
const es = require("event-stream")

const deps = [
    "node_modules/jquery/dist/jquery.min.js",
    "node_modules/angular/angular.min.js",
    "node_modules/angular-ui-router/release/angular-ui-router.min.js",
    "node_modules/bootstrap/dist/js/bootstrap.min.js",
    "node_modules/bootstrap/dist/css/bootstrap.min.css",
    "node_modules/moment/min/moment.min.js"
]

const logfiles = (task) =>
    es.map((file, cb) => {
        gutil.log(gutil.colors.cyan(task), gutil.colors.gray(file.path))
        return cb(null, file)
    })

gulp.task("build:all", ["build:js", "build:html", "build:less", "build:deps"])

gulp.task("build:clean", () => {
    return del("dist/dev")
})

gulp.task("build:html", () => {
    return gulp.src("src/**/*.html", { base: "src" })
        .pipe(cache("html", { optimizeMemory: true }))
        .pipe(remember("html"))
        .pipe(logfiles("build:html"))
        .pipe(gulp.dest("dist/dev"))
        .pipe(connect.reload())
})

gulp.task("build:js", () => {
    return gulp.src("src/**/*.js", { base: "src" })
        .pipe(cache("js", { optimizeMemory: true }))
        .pipe(eslint({ configFile: "eslint.json" }))
        .pipe(eslint.format())
        .pipe(babel({ presets : ["es2015"] }))
        .on("error", (e) => gutil.log(gutil.colors.red(e.message)))
        .pipe(remember("js"))
        .pipe(logfiles("build:js"))
        .pipe(concat("app.js"))
        .pipe(gulp.dest("dist/dev"))
        .pipe(connect.reload())
})

gulp.task("build:less", () => {
    return gulp.src("src/**/*.less", { base: "src" })
        .pipe(less({ paths: ["src"] }))
        .on("error", (e) => gutil.log(gutil.colors.red(e.message)))
        .pipe(logfiles("build:less"))
        .pipe(concat("app.css"))
        .pipe(gulp.dest("dist/dev"))
        .pipe(connect.reload())
})

gulp.task("build:deps", ["build:deps:js", "build:deps:css"])

gulp.task("build:deps:js", () => {
    return gulp.src(deps)
        .pipe(filter("**/*.js"))
        .pipe(logfiles("build:deps:js"))
        .pipe(concat("vendor.js"))
        .pipe(gulp.dest("dist/dev"))
})

gulp.task("build:deps:css", () => {
    return gulp.src(deps)
        .pipe(filter("**/*.css"))
        .pipe(logfiles("build:deps:css"))
        .pipe(concat("vendor.css"))
        .pipe(gulp.dest("dist/dev"))
})

gulp.task("build:watch", () => {
    gulp.watch("src/**/*.html", ["build:html"]).on("change", (ev) => {
        if (ev.type === "deleted") {
            delete cached.caches.html[ev.path]
            remember.forget("html", ev.path)
        }
    })
    gulp.watch("src/**/*.js", ["build:js"]).on("change", (ev) => {
        if (ev.type === "deleted") {
            delete cached.caches.js[ev.path]
            remember.forget("js", ev.path)
        }
    })
    gulp.watch("src/**/*.less", ["build:less"]).on("change", (ev) => {
        if (ev.type === "deleted") {
            delete cached.caches.less[ev.path]
            remember.forget("less", ev.path)
        }
    })
})

gulp.task("serve", sequence("build:clean", "build:all", "build:watch")(() => {
    connect.server({ root: "dist/dev", livereload: true })
}))

gulp.task("default", ["serve"])
