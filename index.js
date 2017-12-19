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

const rot = (s) => s.replace(/[a-zA-Z]/g,function(c){return String.fromCharCode((c<="Z"?90:122)>=(c=c.charCodeAt(0)+13)?c:c-26);})
const slice = (i, j) => (s) => s.slice(i, j)

const wait = (n) => {
    return new Promise((resolve) => {
        setTimeout(resolve, n)
    })
}

pulp.src("*.json")
.then(pulp.concat("foo.js"))
.then(pulp.pipe((x) => {
    console.log(x.path, x.buffer.toString().replace(/\n|\s/g, ""))
}))

/*
.then(pulp.transform(rot))
.then(pulp.transform(slice(0, 25)))
.then(pulp.rename(x => x.replace(/js$/, "json")))
.then(pulp.pipe((x) => {
    console.log(x.path, x.buffer.toString().replace(/\n/g, ""))
}))
.then(pulp.dest("out/"))
*/
