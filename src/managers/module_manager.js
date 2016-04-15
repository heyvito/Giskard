var fs = require('fs'),
    Path = require('path'),
    logger = require('../utils/logger')('ModuleLoader');

/**
 * Represents an object capable of loading and handling modules.
 * @constructor
 */
var ModuleManager = function() {
    this.basePath = Path.resolve(Path.join(__dirname, '..', '..', 'bot_modules'));
    this.modules = {};
    this.modulesInfo = {};
    this.help = [];
};

ModuleManager.prototype = {

    /**
     * Parses a module documentation header and commands
     * @param  {Bot}        bot     The current bot instance
     * @param  {String}     file    Module file path to be parsed
     * @return {AnyObject}          An object containing header and commands properties
     */
    parseHelp: function(file) {
        try {
            var body = fs.readFileSync(file, 'utf-8').split('\n'),
                header = { name: '', authors: [], created: '' },
                commands = [],
                current = null;
            body = body
                .slice(0, body.indexOf(''))
                .filter(l => l.trim().substr(0, 2) === '//')
                .map(l => l.trim().substr(2).trim())
                .forEach(l => {
                    var data;
                    if(l[0] === '$') {
                        if(l.indexOf(':') === -1) {
                            header.name = l.split('$')[1].trim();
                        } else {
                            data = l.split(':');
                            if(data[0].toLowerCase().indexOf('author') > -1) {
                                header.authors = data[1].trim().split(',').map(a => a.trim());
                            } else {
                                header.created = data.slice(1).join(':').trim();
                            }
                        }
                    } else {
                        if(l[0] === '-') {
                            if(!!current) {
                                commands.push(current);
                            }
                            data = l.trim().substr(1).trim().split(':');
                            current = { name: data[0], description: [data[1].trim()] };
                        } else {
                            current.description.push(l.trim());
                        }
                    }
                });
            if(!!current) {
                commands.push(current);
            }
            commands = commands.map(c => {
                c.description = c.description.join(' ');
                return c;
            });
            logger.debug(`Parsed documentation for ${header.name}`);
            return {
                header: header,
                commands: commands
            };
        } catch(ex) {
            logger.error('Error parsing documentation for ' + file);
            logger.error(ex);
            return null;
        }
    },

    /**
     * Reads the modules directory and returns all possible loadable JavaScript files.
     * @return {String[]}       A list of possibly loadable JavaScript modules.
     */
    getModules: function() {
        var files = [],
            folders = [];
        fs.readdirSync(this.basePath)
            .forEach(f => {
                try {
                    var path = Path.join(this.basePath, f),
                        stat = fs.statSync(path);
                    if(stat.isDirectory()) {
                        folders.push(path);
                    } else if(stat.isFile() && Path.extname(f) === '.js') {
                        files.push(path);
                    }
                } catch(ex) {
                    logger.error('Error analysing module structure:');
                    logger.error(ex);
                }
            });
        folders.forEach(f => {
            try {
                var entrypoint = Path.join(f, `${Path.basename(f)}.js`);
                if(fs.existsSync(entrypoint) && fs.statSync(entrypoint).isFile()) {
                    files.push(entrypoint);
                }
            } catch(ex) {
                logger.error('Error analysing folder hierarchy:');
                logger.error(ex);
            }
        });
        return files;
    },

    /**
     * Loads all possible modules, ignoring failed ones.
     * Also parses module's documentations and fills metadata required by any subsystem.
     * @return {Promise}          A Promise that will be resolved whenever all modules have been loaded
     *                            or failed to load. The resulting list will contain all modules
     *                            constructors.
     */
    loadModules: function() {
        logger.info('Loading modules...');
        return new Promise((resolve) => {
            this.getModules()
                .forEach(fp => {
                    try {
                        var mName = Path.basename(fp, '.js'),
                            Ctor = require(fp);
                        Ctor.prototype._meta.moduleName = mName;
                        this.modules[mName] = new Ctor();
                        logger.info(`Loaded module: ${mName}`);
                        var mInfo = this.parseHelp(fp);
                        if(!!mInfo) {
                            this.modulesInfo[mInfo.header.name] = mInfo;
                            this.help = this.help.concat(mInfo.commands.map(c => `${c.name}: ${c.description}`));
                        }
                    } catch(ex) {
                        logger.error(`Error loading module at ${fp}`);
                        logger.error(ex);
                    }
                });
            resolve();
        });
    }
};

module.exports = ModuleManager;
