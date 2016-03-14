var Logger = function(module, ignoreSettings, levelOverride) {
    var l = require('npmlog');

    if(!ignoreSettings && !levelOverride) {
        l.level = require('../models/settings').sharedInstance().loggerLevel;
    } else if(!!levelOverride) {
        l.level = levelOverride;
    }

    var makeLogger = (level, message) => {
        return (message) => {
            return l[level](module, message);
        };
    };

    var levels = ['silly', 'verbose', 'info', 'http', 'warn', 'error', 'silent'],
        aliases = {
            debug: 'verbose',
            warning: 'warn'
        };

    var result = {};
    levels.forEach((n) => result[n] = makeLogger(n));
    Object.keys(aliases).forEach((n) => result[n] = makeLogger(aliases[n]));
    return result;
};

module.exports = function(module, ignoreSettings, levelOverride) {
    return new Logger(module, ignoreSettings, levelOverride);
};
