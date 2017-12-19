let pulp = (() => {

    function pulp () {
        if (this instanceof pulp) {
            this.defered = Promise.resolve()
            this.items = []
        } else {
            return new pulp()
        }
    }

    pulp.prototype.extend = function (defs) {
        function f () {
            if (!(this instanceof pulp)) {
                return new f()
            }
        }
        f.prototype = pulp()
        Object.entries(defs).forEach(([name, fn]) => {
            f.prototype[name] = function (...args) {
                this.defered = this.defered.then(() => fn.apply(this, args))
                return this
            }
        })
        return f
    }

    pulp.prototype.then = function (...args) {
        this.defered = this.defered.then(() => Promise.all(
            args.map((fn) => fn.bind(this)())
        ))
        return this
    }

    pulp.prototype.tap = function (fn) {
        return (...args) => {
            this.then(() => fn.apply(this, args))
            return this
        }
    }

    pulp.prototype.catch = function (fn) {
        this.defered = this.defered.catch(fn)
        return this
    }

    return pulp
})()

const wait = (n) => {
    return new Promise((res, rej) => {
        setTimeout(() => {
            res()
        }, n)
    })
}

const err = () => Promise.reject("!!!")

pulp = pulp().extend({
    foo: () => console.log("hello"),
    bar: () => wait(1000)
})

pulp().foo().bar().foo()


//a().foo().tap(wait)(1000).foo()

/*
const a = () =>
    pulp()
        .tap(console.log)("start a")
        .tap(wait)(1000)
        .tap(console.log)("end a")

const b = () =>
    pulp()
        .tap(console.log)("start b")
        .tap(wait)(1000)
        .tap(console.log)("end b")
*/

/*pulp()
    .tap(console.log)("ok")
    .tap(wait)("x", 1000)
    .tap(wait)("y", 1000)
    .tap(console.log)("lol")*/

//pulp().then(wait("foo", 500), wait("hello", 200)).then(wait("coucou", 1), wait("bar", 500))

//a().then(b, b, b).then(a)

//q.then(() => console.log("1")).then(() => console.log("2")).then(wait(500)).then(() => console.log("3"))

/*
const fs = require("fs")
const glob = require("glob")
const path = require("path")
const mkdirp = require("mkdirp")

const pulp = {

    src: (pattern) => {
        return new Promise((resolve, reject) => {
            glob(pattern, (err, matches) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(matches.map((path) => ({
                        path,
                        buffer: null
                    })))
                }
            })
        })
    },

    dest: (base) => {
        return pulp.pipe((file) => {
            return new Promise((resolve, reject) => {
                const fpath = path.join(base, file.path)
                mkdirp(path.dirname(fpath), (err) => {
                    if (err) {
                        reject(err)
                    } else {
                        fs.writeFile(fpath, file.buffer, (err) => {
                            if (err) {
                                reject(err)
                            } else {
                                resolve(file)
                            }
                        })
                    }
                })
            })
        })
    },

    join: (...args) => {
        return Promise.all(args).then((x) => {
            return [].concat.apply([], x)
        })
    },

    pipe: (callback) => {
        return (files) => {
            return Promise.all(files.map((file) => {
                if (file.buffer) {
                    return Promise.resolve(file).then(callback)
                } else {
                    return new Promise((resolve, reject) => {
                        fs.readFile(file.path, (err, data) => {
                            if (err) {
                                reject(err)
                            } else {
                                file.buffer = data
                                resolve(file)
                            }
                        })
                    }).then(callback)
                }
            })).catch((err) => console.log("ERROR", err))
            .then(() => files)
        }
    },

    concat: (path) => {
        return (files) => {
            return pulp.pipe()(files).then((files) => {
                return [{
                    path,
                    buffer: Buffer.concat(files.map((f) => f.buffer))
                }]
            })
        }
    },

    transform: (callback) => {
        return pulp.pipe((file) => {
            file.buffer = new Buffer(callback(file.buffer.toString()))
        })
    },

    rename: (callback) => {
        return pulp.pipe((file) => {
            file.path = callback(file.path)
        })
    },
}
*/

function gg () {
    if (this instanceof gg) {
        this.task = Promise.resolve();
        this.files = []
    } else {
        return new gg()
    }
}

gg.fn = gg.prototype

function src (pattern) {
    return new Promise((resolve, reject) => {
        glob(pattern, (err, matches) => {
            if (err) {
                reject(err)
            } else {
                resolve(matches.map((path) => ({
                    path,
                    buffer: null
                })))
            }
        })
    })
}

/*
gg.fn.src = function (s) {
    this.task = this.task.then(() => {
        return src(s).then((f) => this.files = this.files.concat(f))
    })
    return this
}
*/

gg.fn.pipe = function (f) {
    this.task = this.task.then(() => {
        return pulp.pipe(f)(this.files).then((res) => {
            this.files = res
        })
    })
    return this
}

gg.fn.then = function (f) {
    this.task = this.task.then(f.bind(this))
    return this
}

gg.fn.extend = function (o) {
    const g = new gg()
    for (var [key, val] of Object.entries(o)) {
        g[key] = function (...args) {
            this.task = this.task.then(() => {
                args = [this].concat(args)
                val.apply(this, args)
            })
            return this
        }
    }
    return g
}

const ok = gg()

g = ok.extend({
    src: function () {
        this.files = this.files.concat([
            { path: "index.js" }
        ])
    }
})

k = g.extend({
    src: function () {
        this.files = this.files.concat([
            { path: "gulpfile.js" }
        ])
        this.meta = "ok"
    }
})

/*
k.src().then(function () {
    console.log(this)
})
*/

/*
const js = () => $.src("*.js").pipe(uglify()).concat("app.min.js").dest("dist")
const html = () => $.src("*.html").concat("out.html").dest("dist")
const build = () => $.all(js, html)

build().then(() => console.log("done"))
*/




