var mongoose = require('mongoose'),
    settings = require('../models/settings').sharedInstance(),
    User = require('../models/user'),
    Context = require('../models/context'),
    Channel = require('../models/channel'),
    logger = require('./logger')('DatabaseConnector');

var connected;

module.exports = {
    User: User,
    Context: Context,
    Channel: Channel,
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
