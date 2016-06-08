const logger = require('../utils/logger')('InstallationManager');
const Git = require("nodegit");
const Path = require('path');
const fs = require('fs-promise');
const ModuleManager = require('./module_manager');
const npmi = require('npmi');
const Bot = require('../bot');
const db = require('../utils/db');

/**
 * Provides runtime module installation mechanisms.
 * @constructor
 * @since 2.0
 */
const InstallationManager = function() {
    this.modulesPath = Path.join(__dirname, '..', '..', 'bot_modules');
};

InstallationManager.prototype = {

    /**
     * Checks if there's a module installed in the given path
     * @param  {String} targetPath Path of the module being installed
     * @param  {String} name       Name of the module being installed
     * @return {Promise}            A promise that is resolved if there's no issues
     *                              with the module being installed. Otherwise, the
     *                              promise will be rejected.
     */
    checkConflict: function(targetPath, name) {
        return db.ModuleMeta.findByName(name)
            .then(meta => {
                var error = new Error('Module is already present!');
                error.code = 'EMODPRESENT';
                error.giskInternal = true;
                return Promise.reject(error);
            })
            .catch(ex => {
                if(ex.code === 'EMODNOTFOUND') {
                    return fs.stat(targetPath);
                } else {
                    return Promise.reject(ex);
                }
            })
            .then(s => {
                if(s.isDirectory()) {
                    logger.warning(`Avoiding conflict with ${name}`);
                    var error = new Error(`Conflict detected. ${name} is already installed.`);
                    error.code = "EREPOCONFLICT";
                    error.giskInternal = true;
                    return Promise.reject(error);
                }
                return Promise.resolve();
            })
            .catch(ex => {
                if(ex.code === 'ENOENT') {
                    return Promise.resolve();
                } else {
                    return Promise.reject(ex);
                }
            });
    },

    /**
     * Rollsback an installation by completely removing the
     * module being installed
     * @param  {String} targetPath Path to the module being installed
     * @return {Promise}            A promise that will always will be resolved,
     *                                regardless of whether the folder structure
     *                                was removed or not.
     */
    rollback: function(targetPath) {
        return fs.remove(targetPath)
            .then(() => ({ success: true }))
            .catch(ex => {
                logger.error('Error rolling back:');
                logger.error(ex);
                logger.warning('Modules pool may be in an unusable state.');
                return Promise.resolve({ success: false });
            });
    },

    /**
     * Provides a promise wrapper to the npmi module, allowing several dependencies
     * to be installed at the same time.
     * @param  {Object} depData    Dependency metadata including name and version
     * @param  {String} targetPath Destination where the dependency will be installed to
     * @return {Promise}            A promise that will be resolved or rejected when
     *                              the dependecy is installed or not.
     */
    installDependency: function(depData, targetPath) {
        const options = {
            name: depData.name,
            version: depData.version,
            path: targetPath,
        };
        return new Promise((resolve, reject) => {
            npmi(options, (err, result) => {
                if(err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    },

    /**
     * Performs an installation procedure on the given repository
     * @param  {String} repo Repository url or a username/repository format
     * @return {Promise}      A promise related to the installation success or failure
     */
    install: function(repo, user) {

        // If no user data is present, we will assume it is being
        // installed by giskard
        user = user || "$GISK";

        const repoExp = /[a-z0-9][a-z0-9-_][a-z0-9]\/[^\/]+/i;
        if(!repo.startsWith('http') && repoExp.test(repo)) {
            repo = `https://github.com/${repo}`;
        } else if(!repo.startsWith('http') && !repoExp.test(repo)) {
            const error = new Error('Invalid repository url');
            error.code = "EINVREPURL";
            error.giskInternal = true;
            return Promise.reject(error);
        }

        const components = repo.split('/');
        const name = components[components.length - 1].replace(/\.git$/i, '');
        const targetPath = Path.join(this.modulesPath, name);
        var moduleMeta, gitRev;
        return this.checkConflict(targetPath, name)
            .then(() => {
                logger.info(`Installing new module from ${repo}`);
                return Git.Clone(repo, targetPath)
                    .then(r => r.getMasterCommit())
                    .then(c => {
                        gitRev = c.sha();
                    });
            })
            .then(() => {
                logger.info('Clone complete. Reading data...');
                return ModuleManager.preloadModule(targetPath);
            })
            .then(mod => {
                if(!mod) {
                    logger.warning('Module loading failed. Rolling back...');
                    var error = new Error('Module parse failed');
                    error.code = 'EMODPARSEERR';
                    error.giskInternal = true;
                    return Promise.reject(error);
                } else {
                    moduleMeta = mod;
                    logger.info('Module is valid. Installing NPM dependencies...');
                    var deps = Object.keys(mod.meta.dependencies)
                        .map(k => ({ name: k, version: mod.meta.dependencies[k] }))
                        .map(d => this.installDependency(d, targetPath));
                    return Promise.all(deps);
                }
            })
            .then(function() {
                if(!Bot.sharedInstance().moduleManager.loadModule(moduleMeta)) {
                    logger.info('Module could not be loaded. Rolling back...');
                    var error = new Error('Module load failed');
                    error.code = 'EMODLOADERR';
                    error.giskInternal = true;
                    return Promise.reject(error);
                } else {
                    return db.ModuleMeta.findOneAndUpdate(
                        { name: name },
                        {
                            name: name,
                            responsible: user,
                            dependenciesHash: db.ModuleMeta.calculateDepsHash(moduleMeta.meta.dependencies),
                            sourceRepo: repo,
                            currentRevision: gitRev
                        },
                        { new: true, upsert: true }
                    )
                    .then(doc => { return Promise.resolve(moduleMeta); })
                    .catch(err => {
                        if(!!err) {
                            logger.warning('Error inserting module on index:');
                            logger.error(err);
                        }
                    });
                }
            })
            .catch(ex => {
                logger.error('Installation failed:');
                logger.error(ex);
                // Allows the error to propagate through the promise chain, since we intercepted it
                // to provide logs and rollback the whole process.
                return this.rollback(targetPath)
                    .then((result) => {
                        ex.giskRolledback = result.success;
                        return Promise.reject(ex);
                    })
                    .catch((rollErr) => {
                        logger.error('Rollback threw an error:');
                        logger.error(rollErr);
                        ex.giskRolledback = false;
                        return Promise.reject(ex);
                    });
            });
    },

    /// Begin update mechanisms

    /**
     * Updates the underlying git repository on a given path
     * @param  {String} name Module name being updated. Used for logging.
     * @param  {String} path Module path being updated.
     * @return {Promise}      A Promise related to the fetch-and-merge operation
     */
    updateModuleRepository: function(name, path) {
        var repository,
            newSha,
            oldSha;
        return Git.Repository.open(path)
            .then(r => {
                repository = r;
                return r.getMasterCommit();
            })
            .then(c => {
                oldSha = c.sha();
                logger.info(`${name}: Head is at ${oldSha}. Fetching origin...`);
                return repository.fetch('origin');
            })
            .then(() => repository.mergeBranches('master', 'origin/master'))
            .then(brandNewSha => {
                newSha = brandNewSha;
                logger.info(`Attaching head to master`);
                return repository.getMasterCommit();
            })
            .then(c => Git.Reset.reset(repository, c, Git.Reset.TYPE.HARD))
            .then(() => {
                logger.info(`${name}: Merge completed.`);
                if(newSha === oldSha) {
                    logger.info(`${name}: Already up-to-date`);

                    // Not actually an error, but easier to notify the caller.
                    // Whatever.
                    var error = new Error('Module is already up-to-date');
                    error.code = 'EMODUPTODATE';
                    error.giskInternal = true;
                    return Promise.reject(error);
                }
                logger.info(`${name}: Head was at ${oldSha}. New revision is ${newSha}.`);
                return { repository, newSha, oldSha };
            });
    },

    /**
     * Checks if a given module contains a valid structure by checking
     * if it exists on the disk
     * @param  {String} modulePath Path to the module to be inspected.
     * @return {Promise}            A promise related to the stat operation
     */
    checkModuleStructure: function(modulePath, name) {
        return fs.stat(modulePath)
            .catch(ex => {
                if(ex.code === 'ENOENT') {
                    logger.warning(`${name}: Exists on index, but not on fs. Purging...`);
                    db.ModuleMeta.remove({ name: name });
                    var error = new Error('Invalid module structure.');
                    error.code = 'EINVALIDMODSTRUCTURE';
                    error.giskInternal = true;
                    return Promise.reject(error);
                } else {
                    logger.error(`${name}: ::checkModuleStructure: Unexpected error.`);
                    logger.error(ex);
                    return Promise.reject(ex);
                }
            });
    },

    /**
     * Safely updates dependencies for a given module
     * @param  {String} name Module name being updated. Used for logging.
     * @param  {Object} mod  Metadata associated to the module being updated.
     * @return {Promise}      A promise related to the update operation
     */
    updateModuleDependencies: function(name, mod, gitData) {
        logger.info(`${name}: Backing-up current dependencies...`);
        var currentNodeModules = Path.join(mod.meta.root, 'node_modules'),
            backupNodeModules = Path.join(mod.meta.root, 'node_modules_bak');

        return fs.move(currentNodeModules, backupNodeModules)
            .then(() => {
                var deps = Object.keys(mod.meta.dependencies)
                        .map(k => ({ name: k, version: mod.meta.dependencies[k] }))
                        .map(d => this.installDependency(d, mod.meta.root));
                return Promise.all(deps)
                    .catch(ex => {
                        // Okay, something went awry. Just intercept it, log it,
                        // and throw it again.
                        logger.error(`${name}: Error updating dependencies. Reverting...`);
                        return this.updateRollbackToRef(name, mod, gitData.repository, gitData.oldSha, true)
                            .then(() => {
                                var error = new Error('Error updating dependencies.');
                                error.code = 'EUPDATINGDEPS';
                                error.giskInternal = true;
                                error.reloadModule = true;
                                return Promise.reject(error);
                            })
                    })
                    .then(() => {
                        return mod;
                    });
            });
    },

    /**
     * Completes the update process by removing backup files, if any
     * @param  {String} name Name of the module being updated, for logging.
     * @param  {Object} mod  Module metadata
     * @return {undefined}      Nothing
     */
    cleanupUpdateBackups: function(name, mod) {
        var currentNodeModules = Path.join(mod.meta.root, 'node_modules'),
            backupNodeModules = Path.join(mod.meta.root, 'node_modules_bak');
        fs.remove(backupNodeModules)
            .then(() => logger.info(`${name}: Backup removal completed.`))
            .catch(ex => {
                logger.warning(`${name}: Backup removal failed:`);
                logger.error(ex);
            });
    },

    /**
     * Attempts to perform a rollback operation on a module that
     * was broken by a damaged update.
     * @param  {String} name      Name of the module affected. For logging.
     * @param  {Object} mod       Metadata regarding the updated module.
     * @param  {Object} gitData   Repository metadata obtained during the checkout process
     * @param  {Boolean} skipThrow Whether to skip the Promise rejection. Useful when you
     *                             want to perform the rollback in a silent way.
     * @return {Promise}           Promise related to the rollback process
     */
    updateRollbackToRef: function(name, mod, gitData, skipThrow) {
        logger.info(`${name}: Attempting to rollback changes to ref ${gitData.oldSha}`);
        var currentNodeModules = Path.join(mod.meta.root, 'node_modules'),
            backupNodeModules = Path.join(mod.meta.root, 'node_modules_bak');
        return fs.stat(backupNodeModules)
            .then(s => {
                if(s.isDirectory()) {
                    return fs.remove(currentNodeModules)
                        .then(() => fs.move(backupNodeModules, currentNodeModules))
                }
                return Promise.resolve();
            })
            .catch(ex => {
                if(ex.code !== 'ENOENT') {
                    logger.error(`${name}: Error rolling back node_modules state. Procedure will continue.`);
                    logger.error(ex);
                }
            })
            .then(() => {
                logger.info(`Hard resetting to ${gitData.oldSha}`);
                return gitData.repository.getCommit(gitData.oldSha);
            })
            .then(c => Git.Reset.reset(gitData.repository, c, Git.Reset.TYPE.HARD))
            .then((status) => {
                if(!skipThrow) {
                    logger.info(`${name}: Rollback completed.`);
                    var error = new Error('Update broke module');
                    error.code = 'EUNSTABLEUPDATE';
                    error.giskInternal = true;
                    error.oldSha = gitData.oldSha;
                    error.newSha = gitData.newSha;
                    error.reloadModule = true;
                    return Promise.reject(error);
                }
            });
    },

    /**
     * Updates a module by its name
     * @param  {String} name The module name being updated
     * @return {Promise}      A promise related to the update process
     */
    update: function(name) {
        logger.info(`${name}: Attempting update.`);
        var modulePath,
            gitData,
            meta,
            oldModState,
            newModState;
        return db.ModuleMeta.findByName(name)
            .then((m) => {
                logger.info(`${name}: Checking module structure...`);
                modulePath = Path.join(this.modulesPath, name);
                meta = m;
                return this.checkModuleStructure(modulePath, name);
            })
            .then(() => ModuleManager.preloadModule(modulePath))
            .then(mod => {
                // Lets cache it for the worst.
                oldModState = mod;
            })
            .then(() => this.updateModuleRepository(name, modulePath))
            .then(repoMeta => {
                Bot.sharedInstance().moduleManager.unloadModule(name);
                logger.info(`${name}: Changes detected. Reloading...`);
                gitData = repoMeta;
                return ModuleManager.preloadModule(modulePath);
            })
            .then(mod => {
                if(!mod) {
                    logger.info(`${name}: Cannot read metadata on ${newSha}. Reverting to ${oldSha}.`);
                    return this.updateRollbackToRef(name, oldModState, gitData);
                } else {
                    newModState = mod;
                    logger.info(`${name}: Metadata was updated. Checking dependency updates...`);
                    if(meta.needsUpdate(mod.meta.dependencies)) {
                        logger.info(`${name}: Dependencies changed.`);
                        return this.updateModuleDependencies(name, mod, gitData);
                    } else {
                        logger.info(`${name}: Dependencies are intact. Moving on.`);
                        return mod;
                    }
                }
            })
            .then(mod => {
                if(!Bot.sharedInstance().moduleManager.loadModule(mod)) {
                    logger.warning(`${name}: Cannot reload module. Reverting...`);
                    return this.updateRollbackToRef(name, mod, gitData);
                }
                return mod;
            })
            .then(mod => {
                meta.dependenciesHash = db.ModuleMeta.calculateDepsHash(mod.meta.dependencies);
                meta.currentRevision = gitData.newSha;
                db.ModuleMeta.findOneAndUpdate({ name: name }, meta)
                    .then(() => {}) // FIXME: Mongoose is really requiring this? FFS.
                    .catch(ex => {
                        logger.error(`${name}: Error updating model:`);
                        logger.error(ex);
                    });
                logger.info(`${name}: Update succeeded. Removing backup files...`);
                this.cleanupUpdateBackups(name, mod);
                return mod;
            })
            .catch(ex => {
                if(ex.code === 'EMODNOTFOUND') {
                    logger.warning(`${name}: Cannot update. Module not found on index.`);
                }
                if(ex.giskInternal) {
                    if(ex.reloadModule) {
                        logger.info(`${name}: Trying to reload old module structure...`);
                        ex.reloadSucceeded = Bot.sharedInstance().moduleManager.loadModule(oldModState);
                        if(!ex.reloadSucceeded) {
                            logger.error(`${name}: CRITICAL. Attempt to reload old structure failed. There's no much we can do here.`);
                        } else {
                            logger.info(`${name}: Old structure is operational.`);
                        }
                    }
                    return Promise.reject(ex);
                } else {
                    logger.error(`${name}: Unexpected error:`);
                    logger.error(ex);
                    return Promise.reject(ex);
                }
            });
    },

    /// Begin uninstall mechanisms

    /**
     * Removes the filesystem structure of a given module
     * @param  {String} path Path of the module being removed
     * @param  {String} name Name of the module being removed
     * @return {Promise}      Promise related to the removal process
     */
    removeModule: function(path, name) {
        logger.info(`${name}: ::removeModule called`);
        return fs.remove(path)
            .catch(ex => {
                logger.error(`${name}: Error removing:`);
                logger.error(ex);
            })
    },

    /**
     * Removes a module by its name
     * @param  {String} name Module name being removed
     * @return {Promise}      Promise related to the removal process
     */
    uninstall: function(name) {
        var modulePath;
        logger.info(`${name}: Attempting uninstall.`);
        return db.ModuleMeta.findByName(name)
            .then((m) => {
                logger.info(`${name}: Checking module structure...`);
                modulePath = Path.join(this.modulesPath, name);
                meta = m;
                return this.checkModuleStructure(modulePath, name);
            })
            .then(m => this.removeModule(modulePath, name))
            .then(m => db.ModuleMeta.findOneAndRemove({ name: name }))
            .then(m => { Bot.sharedInstance().moduleManager.unloadModule(name) })
            .catch(ex => {
                if(!ex.giskInternal) {
                    logger.error(`${name}: Unexpected error performing uninstall:`);
                    logger.error(ex);
                }
                return Promise.reject(ex);
            });
    }
};

module.exports = InstallationManager;
