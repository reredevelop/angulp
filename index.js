const glob = require("glob")
const fs = require("fs")
const path = require("path")

const src = (s) => {
    return new Promise((success, fail) => {
        glob(s, (err, files) => {
            if (err) {
                fail(err)
            } else {
                success(files.map((f) => ({
                    src: f,
                    data: null
                })))
            }
        })
    })
}

const read = (source) => {
    const defered = source.map((i) => {
        return new Promise((resolve, reject) => {
            if (i.data) return resolve(i)
            fs.readFile(i.src, (err, data) => {
                if (err) {
                    reject(err)
                } else {
                    i.data = data
                    resolve(i)
                }
            })
        })
    })
    return Promise.all(defered)
}

const concat = (dest) => {
    return (source) => {
        return read(source).then((source) => {
            return [{
                src: dest,
                data: Buffer.concat(source.map(x => x.data))
            }]
        })
    }
}

const out = (dest) => {
    return (source) => {
        const defered = source.map((i) => {
            return new Promise((resolve, reject) => {
                fs.writeFile(path.join(dest, i.src), i.data, (err) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(i)
                    }
                })
            })
        })
        return Promise.all(defered)
    }
}

const add = (more) => {
    return (source) => {
        return more.then((result) => {
            return source.concat(result)
        })
    }
}

const replace = (regex, str) => {
    return (source) => {
        return Promise.resolve(source.map((i) => {
            i.src = i.src.replace(regex, str)
            return i
        }))
    }
}

const fn = (cb) => {
    return (source) => {
        return Promise.resolve(source.map((i) => {
            i.src = cb(i.src)
            return i
        }))
    }
}

const foo = (cb) => {
    return (source) => {
        return read(source).then((source) => {
            return Promise.resolve(source.map((i) => {
                i.data = cb(i)
                return i
            }))
        })
    }
}

const uglify = foo((i) => {
    var uglify = require("uglify-js")
    return new Buffer(uglify.minify(i.data.toString()).code)
})

const log = foo((i) => {
    console.log(i.src, i.data.toString())
    return i
})

var bar = () => src("./a.js").then(uglify).then(log)

bar().then(bar).then(bar)








