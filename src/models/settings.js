var Singleton = require('../utils/singleton'),
    Path = require('path'),
    fs = require('fs'),
    _ = require('lodash'),
    logger = require('../utils/logger')('Settings', true);

var Settings = function() {
    this.rootDir = Path.resolve(Path.join(__dirname, '..', '..'));
    this.defaultSettings = {
        mongoUrl: 'mongodb://localhost:27017/giskard',
        adapter: 'shell',
        nicknames: [],
        loggerLevel: 'info',
        httpServerPort: 2708,
        token: null,
        roots: [],
        sentryUri: null
    };
    this.envAliases = {
        'PORT': 'httpServerPort',
        'MONGO_URL': 'mongoUrl'
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
        logger.error('Error loading settings file: ');
        logger.error(ex);
        process.exit(1);
    }

    _.merge(preConf, this.defaultSettings, fileConf);
    Object.keys(this.defaultSettings)
        .forEach(k => {
            if(process.env[k]) {
                preConf[k] = process.env[k];
            }
        });

    Object.keys(this.envAliases).forEach(k => {
        if(process.env[k]) {
            preConf[this.envAliases[k]] = process.env[k];
        }
    });

    _.merge(this, preConf);

    // TODO: At this point, iterate preConf and assign readonly properties to `this` scope,
    // using only getters.
};

module.exports = new Singleton(Settings);
