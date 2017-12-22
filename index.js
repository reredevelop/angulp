let pulp = (() => {

    const pulp = {}

    pulp.extend = function (defs) {
        Object.entries(defs).forEach(([name, fn]) => {
            this[name] = function (...args) {
                function f () {}
                f.prototype = this
                const child = new f
                if (!child.deferred) {
                    child.deferred = Promise.resolve()
                }
                if (!child.meta) {
                    child.meta = {}
                }
                child.deferred = child.deferred.then(() => {
                    return fn.apply(child.meta, args)
                })
                return child
            }
        })
    }

    pulp.extend({
        then: function (...args) {
            return Promise.all(args.map(f => f.call(this, this)))
        }
    })

    return pulp
})()

const err = () => Promise.reject("!!!")
const wait = (n) => {
    return new Promise((res, rej) => {
        setTimeout(() => {
            res()
        }, n)
    })
}

function src (pattern) {
}

function readf (file) {
    const fs = require("fs")
    return new Promise((resolve, reject) => {
        fs.readFile(file.path, (err, data) => {
            err ? reject(err) : resolve(data)
        })
    })
    .then(data => file.data = data)
    .then(file)
}

function writeto (path, buffer) {
    const fs = require("fs")
    return new Promise((resolve, reject) => {
        fs.writeFile(path, buffer, (err) => {
            if (err) reject(err)
        })
    })
}


const api = {
    glob: function (pattern) {
        const glob = require("glob")
        return new Promise((resolve, reject) => {
            glob(pattern, {}, (err, matches) => {
                err ? reject(err) : resolve(matches)
            })
        }).then(matches => {
            this.src = matches.map(path => ({ path }))
        })
    },
    copyto: function (dest) {
        const path = require("path")
        return Promise.all(this.src.map(f => writeto(path.join(dest, f.dest), f.data)))
    },
    concat: function (dest) {
        return Promise.all(this.src.map(readf)).then(() =>
            this.src = [{
                dest,
                data: Buffer.concat(this.src.map(f => f.data))
            }]
        )
    },
    pipe: function (fn) {
        return Promise.all(
            this.src.map(f => Promise.resolve().then(() => {
                const ret = fn(f.data.toString())
                f.data = ret
                return ret
            }))
        )
    },
    each: function (fn) {
        return Promise.all(this.src.map(f => fn(f)))
    }
}

pulp.extend(api)

pulp.extend({
    wait: function (n) {
        return wait(n)
    },
    name: function (s) {
        this.name = s
    },
    inc: function () {
        this.x = this.x ? this.x + 1 : 1
    },
    log: function () {
        console.log(this.name, this.x)
    }
})

const rot13 = (s) => s.replace(/[a-zA-Z]/g,function(c){return String.fromCharCode((c<="Z"?90:122)>=(c=c.charCodeAt(0)+13)?c:c-26);})

//pulp.name("foo").inc().log().inc().log().inc().log()
//pulp.name("bar").inc().log().inc().log().inc().log()

pulp.glob("*.js")
    .concat("tmp.js")
    .pipe(rot13)
    .copyto(".")
    //.then(x => x.src.forEach(i => console.log(i)))
    //.each(f => f.data = f.data.slice(0, 5))
    //.then(console.log)

pulp.watch("*.js", {
    changed (file) {
        file.pipe(rot13).copyto("...")
    }
})


/*
function f() {}
f.prototype = pulp
const x = new f

x.extend({
    foo: function () {
        console.log("foo")
    }
})
*/

//x.src("a").src("b").foo()




/*
const js = () => $.src("*.js").pipe(uglify()).concat("app.min.js").dest("dist")
const html = () => $.src("*.html").concat("out.html").dest("dist")
const build = () => $.all(js, html)

build().then(() => console.log("done"))
*/
