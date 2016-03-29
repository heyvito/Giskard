var Singleton = require('./singleton'),
    raven = require('raven'),
    logger = require('./logger')('Sentry'),
    pkg = require('../../package.json');

var Sentry = function() {
    var key = (require('../models/settings').sharedInstance()).sentryUri;
    if(key) {
        this.client = new raven.Client(key, {
            release: process.env.GIT_REV || pkg.version
        });
        logger.info('Ready.');
    } else {
        this.client = null;
        logger.warning('Not working: Missing sentryUri setting key');
    }
}

Sentry.prototype = {
    setup: function() {
        if(this.client) {
            logger.verbose('Armed.');
            this.client.patchGlobal();
        }
    },
    recordError: function(ex) {
        try {
            if(this.client) {
                this.client.captureException(ex);
            }
        } catch(ex) {
            logger.error(ex);
        }
    },
    recordEvent: function() {
        return this.recordError.apply(this, arguments);
    }
}

module.exports = new Singleton(Sentry);
