var Singleton = require('../utils/singleton'),
    Path = require('path'),
    fs = require('fs'),
    _ = require('lodash'),
    logger = require('../utils/logger')('Settings', true);

var Settings = function() {
    this.rootDir = Path.resolve(Path.join(__dirname, '..', '..'));
    this.settingsTypes = {
        mongoUrl: String,
        adapter: String,
        nicknames: Array,
        loggerLevel: String,
        httpServerPort: Number,
        token: String,
        roots: Array,
        sentryUri: String
    }
    this.defaultSettings = {
        mongoUrl: 'mongodb://localhost:27017/giskard',
        adapter: 'debug',
        nicknames: [],
        loggerLevel: 'info',
        httpServerPort: 2709,
        token: null,
        roots: [],
        sentryUri: null
    };

    var fileConf = {},
        preConf = {};
    try {
        var path = Path.resolve(process.env.GISKARDCONF || Path.join(this.rootDir, 'settings.json'));
        if(fs.existsSync(path)) {
            var file = fs.readFileSync(path).toString();
            fileConf = JSON.parse(file);
        }
    } catch(ex) {
        logger.debug('Error loading settings file: ');
        logger.debug(ex);
        logger.warn('Falling back to enviroment-based configuration.');
    }

    _.merge(preConf, this.defaultSettings, fileConf);

    Object
        .keys(process.env)
        .filter(k => k.indexOf('GISKARD_') === 0)
        .map(k => {
            var normalisedKey = k.replace('GISKARD_', '')
                .split('_')
                .map(c => `${c[0].toUpperCase()}${c.substr(1).toLowerCase()}`)
                .join('');
            normalisedKey = `${normalisedKey[0].toLowerCase()}${normalisedKey.substr(1)}`;
            return [k, normalisedKey];
        })
        .forEach(kp => {
            var envKey = kp[0],
                giskKey = kp[1],
                value = process.env[kp[0]],
                expectedType = this.settingsTypes[giskKey];

            if(expectedType === Array) {
                value = value.split(',');
            } else if(expectedType === Number) {
                value = parseInt(value, 10);
            }

            if(value !== undefined) {
                preConf[kp[1]] = value;
            }
        });

    _.merge(this, preConf);

    // TODO: At this point, iterate preConf and assign readonly properties to `this` scope,
    // using only getters.
};

module.exports = new Singleton(Settings);
