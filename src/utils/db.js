var mongoose = require('mongoose'),
    settings = require('../models/settings').sharedInstance(),
    User = require('../models/user'),
    Context = require('../models/context'),
    Channel = require('../models/channel'),
    logger = require('./logger')('DatabaseConnector'),
    ModuleMeta = require('../models/module_meta'),
    UserAssoc = require('../models/user_assoc');

var connected;

module.exports = {
    User: User,
    Context: Context,
    Channel: Channel,
    ModuleMeta: ModuleMeta,
    UserAssoc: UserAssoc,

    /**
     * Prepares the database connector to run
     * @return {Promise}      A Promise that will be resolved whenever the connection is established.
     *                        Further calls to this function will return a resolved promise.
     */
    prepare: () => {
        if(connected) {
            return Promise.resolve();
        } else {
            return new Promise((resolve, reject) => {
                logger.verbose(`Connecting to ${settings.mongoUrl}`);
                mongoose.connect(settings.mongoUrl);
                mongoose.connection
                    .on('open', resolve)
                    .on('open', () => { connected = true; })
                    .on('error', reject);
            });
        }
    }
};
