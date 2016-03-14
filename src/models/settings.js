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
    };

    try {
        var path = Path.resolve(process.env.GISKARDCONF || Path.join(this.rootDir, 'settings.json'));
        if(!fs.existsSync(path)) {
            logger.error(`Cannot find configuration file at ${path}. Please refer to the Readme.`);
            process.exit(1);
        } else {
            var file = fs.readFileSync(path).toString(),
                jsonData = JSON.parse(file);
            _.merge(this, this.defaultSettings, jsonData);
        }
    } catch(ex) {
        logger.error('Error loading configuration file: ');
        logger.error(ex);
        process.exit(1);
    }
}

module.exports = new Singleton(Settings);
