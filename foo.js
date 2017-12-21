const gulp = require("gulp")
const inject = require("gulp-inject")
const babel = require("gulp-babel")
const connect = require("gulp-connect")
const concat = require("gulp-concat")
const less = require("gulp-less")
const templatecache = require("gulp-angular-templatecache")
const del = require("del")
const gutil = require("gulp-util")
const eslint = require("gulp-eslint")
const tap = require("gulp-tap")
const fs = require("fs")

let index;

gulp.task("inject", () => {
    const json = JSON.parse(fs.readFileSync("package.json"))
    const deps = Object.keys(json.dependencies).map(d => `node_modules/${d}/**/${d}.{js,css}`)
    const injected = gulp.src([].concat(deps, "src/**/*.{js,css}", "!node_modules/**/src/**"), { read: false })
    return gulp.src("src/index.html")
        .pipe(inject(injected, { addPrefix: "..", addRootSlash: false }))
        .pipe(tap(file => index = file.contents.toString()))
        .pipe(connect.reload())
})

gulp.task("default", ["inject"], () => {

    const app = connect.server({
        livereload: true,
        middleware: (connect, opt) => {
            return [(req, res, next) => {
                req.url === "/" ? res.end(index) : next()
            }]
        }
    })

    gulp.watch("package.json", ["inject"])

    gulp.watch("src/**/*.js").on("change", (file) => {
        gutil.log("File", gutil.colors.cyan(file.path), "changed")
        gulp.src(file.path)
            .pipe(eslint({ configFile: "eslint.json" }))
            .pipe(eslint.format())
            .pipe(tap(() => {
                console.log("done")
            }))
        app.lr.changed({ body: { files: "index.html" } })
    })

    gulp.watch("src/**/*.css").on("change", (file) =>
        app.lr.changed({ body: { files: file.path } }))
})
