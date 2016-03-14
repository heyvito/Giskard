var fs = require('fs'),
    Path = require('path'),
    Promise = require('bluebird');

var Adapters = function() {
    this.basePath = Path.resolve(Path.join(__dirname, '..', 'adapters'));
}

Adapters.prototype = {
    getAdapters: function() {
        return fs.readdirSync(this.basePath)
            .map(d => Path.join(this.basePath, d))
            .filter(d => fs.statSync(d).isDirectory())
            .filter(d => fs.readdirSync(d).some(f => f === 'index.js'))
            .map(d => Path.basename(d));
    },
    loadAdapter: function(name) {
        return new Promise((resolve, reject) => {
            var entrypoint = Path.join(this.basePath, name, 'index.js');
            try {
                var klass = require(entrypoint);
                resolve(klass);
            } catch(ex) {
                reject(ex);
            }
        });
    }
}

module.exports = Adapters;
