var express = require('express'),
    bodyParser = require('body-parser'),
    settings = require('../models/settings').sharedInstance(),
    logger = require('../utils/logger')('ApiManager');

/**
 * Represents an object responsible for exposing the bot's HTTP API.
 * @constructor
 */
var ApiManager = function() {
    this.port = settings.httpServerPort;
    logger.info(`Initialised with port: ${this.port}`);
    this.server = express();
    this.server.use(bodyParser.urlencoded({ extended: false }))
    this.server.use(bodyParser.json())
    this.router = undefined;
    this.server.use((req, res, next) => this.router(req, res, next));
    this.routes = {};
    this.rebuildRouter();
}

ApiManager.prototype = {

    /**
     * Starts the server.
     * @return {ApiManager} This very same ApiManager instance.
     * @chainable
     */
    startServer: function() {
        logger.debug('Server started.');
        this.server.listen(this.port);
        return this;
    },

    /**
     * Adds a new route to the server's routing table.
     * @param {String}   type     Type of the route. Valid values are `get`, `head`, `post`, `put`,
     *                            `patch`, and `delete`.
     * @param {String}   path     Patch of the route to be exposed.
     * @param {Function} callback Callback to be called whenever this route is requested by an
     *                            external application or user.
     * @return {ApiManager} This very same ApiManager instance.
     * @chainable
     */
    addRoute: function(moduleName, type, path, callback) {
        type = (type || '').toLowerCase();
        var validTypes = ['get', 'head', 'post', 'put', 'patch', 'delete'];
        if(validTypes.indexOf(type) === -1) {
            throw new Error(`Expected type to be one of: ${validTypes.join(', ')}. Got ${type}`);
        }
        if(!this.routes.hasOwnProperty(moduleName)) {
            this.routes[moduleName] = { suspended: false, paths: [] }
        }
        logger.debug(`${moduleName}: Registered new ${type} route to ${path}`);
        this.routes[moduleName].paths.push({
            type: type,
            path: path,
            callback: callback
        });
        this.rebuildRouter();
        return this;
    },

    /**
     * Registers any system-related routes
     * @return {undefined} Nothing
     * @since 2.0
     */
    registerSystemRoutes: function() {
        this.router.get('/status', (req, res) => res.send('ok'));
    },

    /**
     * Rebuilds the application router considering new routes
     * @return {undefined} Nothing
     * @since 2.0
     */
    rebuildRouter: function() {
        this.router = express.Router();
        this.registerSystemRoutes();
        Object.keys(this.routes)
            .forEach(k => {
                var obj = this.routes[k];
                if(obj.suspended) {
                    return;
                }
                obj.paths.forEach(r => {
                    this.router[r.type](r.path, r.callback);
                });
            });
    },

    /**
     * Suspends all routes for a given module
     * @param  {String} name Module name to be suspended
     * @return {undefined}      Nothing
     * @since 2.0
     */
    suspendRoutesForModuleNamed: function(name) {
        if(this.routes.hasOwnProperty(name)) {
            this.routes[name].suspended = true;
            this.rebuildRouter();
        }
    },

    /**
     * Resumes all routes for a given module
     * @param  {String} name Module name to be resumed
     * @return {undefined}      Nothing
     * @since 2.0
     */
    resumeRoutesForModuleNamed: function(name) {
        if(this.routes.hasOwnProperty(name)) {
            this.routes[name].suspended = false;
            this.rebuildRouter();
        }
    },

    /**
     * Removes all routes for a given module
     * @param  {String} name Name of the module to have its routes removed
     * @return {undefined}      Nothing
     * @since 2.0
     */
    purgeRoutesForModuleNamed: function(name) {
        if(this.routes.hasOwnProperty(name)) {
            delete this.routes[name];
            this.rebuildRouter();
        }
    }
};

module.exports = ApiManager;
