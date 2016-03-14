var fs = require('fs'),
    Path = require('path'),
    logger = require('../utils/logger')('ModuleLoader')

var ModuleManager = function() {
    this.basePath = Path.resolve(Path.join(__dirname, '..', '..', 'bot_modules'));
    this.modules = {};
    this.modulesInfo = {};
    this.help = [];
}

ModuleManager.prototype = {
    parseHelp: function(file) {
        try {
            var body = fs.readFileSync(file, 'utf-8').split('\n'),
                header = { name: '', authors: [], created: '' },
                commands = [];
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
                            current.description.push(line.trim());
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
    getModules: function() {
        return fs.readdirSync(this.basePath)
            .filter(f => Path.extname(f) === '.js')
            .map(f => Path.join(this.basePath, f));
    },
    loadModules: function() {
        logger.info('Loading modules...');
        return new Promise((resolve) => {
            this.getModules()
                .forEach(fp => {
                    try {
                        var mName = Path.basename(fp, '.js'),
                            Ctor = require(fp);
                        Ctor.prototype._meta = {
                            moduleName: mName
                        };
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
}

module.exports = ModuleManager;
