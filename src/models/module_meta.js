const mongoose = require('mongoose');
const crypto = require('crypto');

const moduleMetaSchema = mongoose.Schema({
    name: { type: String, index: { unique: true } },
    responsible: { type: String },
    dependenciesHash: { type: String },
    sourceRepo: { type: String },
    currentRevision: { type: String }
});

const md5Digest = function(data) {
    return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * Returns the ModuleMeta descrption. Useful during debug.
 * @return {String}     ModuleMeta description.
 * @memberOf ModuleMeta
 * @method toString
 * @instance
 */
moduleMetaSchema.methods.toString = function() {
    return `[Giskard::Models::ModuleMeta <${this.id}>`;
}

const calculateDepsHash = function(deps) {
    const data = Object.keys(deps)
        .sort()
        .map(k => [k, deps[k]]);
    return md5Digest(JSON.stringify(data));
}

/**
 * Determines if this module needs update, based on
 * a diff of the dependency chain.
 * @param {Object} newDeps Possibly new dependency chain.
 * @return {Boolean}     Whether the module must be updated or not.
 * @memberOf ModuleMeta
 * @method toString
 * @instance
 */
moduleMetaSchema.methods.needsUpdate = function(newDeps) {
    return this.dependenciesHash !== calculateDepsHash(newDeps);
}

/**
 * Calculates the hash digest of a dependency chain
 * @param  {Object} deps Dependency chain to be calculated
 * @return {String}      Hash digest of the dependency chain
 * @memberOf ModuleMeta
 * @method  calculateDepsHash
 * @static
 */
moduleMetaSchema.statics.calculateDepsHash = calculateDepsHash;

/**
 * Finds a single module by its name. Utility method
 * wrapped in a Promise
 * @param  {String} name Name of the module to be searched for
 * @return {Promise}      A promise that will be resolved if the module is found, and
 *                          rejected otherwise.
 */
moduleMetaSchema.statics.findByName = function(name) {
    return new Promise((resolve, reject) => {
        this.findOne({ name: name })
            .then((meta) => {
                if(!meta) {
                    var error = new Error('Module not found on index');
                    error.code = 'EMODNOTFOUND';
                    error.giskInternal = true;
                    return reject(error);
                }
                resolve(meta);
            });
        });
}

/**
 * Returns a list of all registered modules
 * @return {Promise}      Promise that will be resolved regardless of the
 *                        presence of modules in the datastore.
 */
moduleMetaSchema.statics.all = function() {
    return new Promise(resolve => {
        this.find({})
            .then(docs => resolve(docs));
    });
};

/**
 * Represents an installed module metadata
 * @name ModuleMeta
 * @constructor
 * @since  2.0
 */
module.exports = mongoose.model('ModuleMeta', moduleMetaSchema);
