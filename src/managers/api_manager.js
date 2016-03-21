var express = require('express'),
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
    this.server.get('/status', (req, res) => res.send('ok'));
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
    addRoute: function(type, path, callback) {
        type = (type || '').toLowerCase();
        var validTypes = ['get', 'head', 'post', 'put', 'patch', 'delete'];
        if(validTypes.indexOf(type) === -1) {
            throw new Error(`Expected type to be one of: ${validTypes.join(', ')}. Got ${type}`);
        }
        logger.debug(`Registered new ${type} route to ${path}`);
        this.server[type](path, callback);
        return this;
    }
};

module.exports = ApiManager;
