var fs = require('fs'),
    Path = require('path');

/**
 * Represents an object capable of listing and loading adapters using defined
 * conventions.
 *
 * @constructor
 */
var Adapters = function() {
    this.basePath = Path.resolve(Path.join(__dirname, '..', 'adapters'));
};

Adapters.prototype = {

    /**
     * Gets a list of available adapters in the adapters folder.
     * @return {String[]}           List containing the names of available adapters.
     */
    getAdapters: function() {
        return fs.readdirSync(this.basePath)
            .map(d => Path.join(this.basePath, d))
            .filter(d => fs.statSync(d).isDirectory())
            .filter(d => fs.readdirSync(d).some(f => f === 'index.js'))
            .map(d => Path.basename(d));
    },

    /**
     * Loads an adapter.
     * @param  {String} name Name of the adapter to be loaded.
     * @return {Promise}     Promise that will be resolved when the given adapter is loaded.
     *                       Can be rejected if there's a problem during the process.
     */
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
};

module.exports = Adapters;
