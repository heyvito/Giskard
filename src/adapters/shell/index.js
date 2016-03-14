var fs = require('fs'),
    readline = require('readline'),
    stream = require('stream'),
    cline = require('cline'),
    chalk = require('chalk');

var BaseAdapter = require('../../base_adapter'),
    histPath = '.bot_history';

var ShellAdapter = function(bot) {
    BaseAdapter.call(this, bot);
};

ShellAdapter.prototype = {

    setup: function() {
        this.userDmChannel = new this.db.Channel({
            id: '__shellUserDMChannel',
            name: 'shellUserDMChannel',
            deleted: false,
            partOf: true
        });
        this.botDmChannel = new this.db.Channel({
            id: '__shellBotDMChannel',
            name: 'shellBotDMChannel',
            deleted: false,
            partOf: true
        })
        this.baseUser = new this.db.User({
            id: '__shellBaseUser',
            username: '__shellBaseUser',
            name: 'Shell User',
            deleted: false,
            lastSeen: Date.now(),
            presence: 'active',
            roles: ['root']
        });
        this.botUser = new this.db.User({
            id: '__shellBotUser',
            username: '__shellBotUser',
            name: 'Bot',
            deleted: false,
            lastSeen: Date.now(),
            presence: 'active',
            roles: ['root']
        });
        return Promise.resolve();
    },
    contextlessSend: function(target, string) {
        console.log('@' + chalk.blue.bold(target.id) + ': ' + chalk.green.bold(string));
    },
    send: function(envelope, string) {
        console.log('@' + chalk.blue.bold(envelope.channel.id) + ': ' + chalk.green.bold(string));
        return Promise.resolve({
            ts: Date.now(),
            channel: envelope.channel,
            user: envelope.user
        });
    },
    run: function() {
        this.initialiseConsole();
        this.loadHistory(function(hist) {
            this.console.history(hist);
            this.console.interact('Bot> ');
        }.bind(this));
        // this.ready();
    },
    initialiseConsole: function() {
        this.console = cline();
        this.console.command('*', function(input) {
            this.receive(this.makeEnvelope(input, {}, this.baseUser, this.userDmChannel));
        }.bind(this));
        this.console.command('history', function() {
            this.cli.history.forEach(function(item) {
                console.log(item);
            });
        }.bind(this));
        this.console.on('history', function(item) {
            if(item.length > 0 && ['exit', 'history'].indexOf(item) === -1) {
                fs.appendFile(histPath, item + '\n', function(err) {
                    if(err) {
                        this.bot.emit('error', err);
                    }
                }.bind(this));
            }
        }.bind(this));
        this.console.on('close', function() {
            var history = this.console.history();
            if(history.length > 1024) {
                var startIndex = history.length - 1024;
                history = history.reverse().splice(startIndex, 1024);
                var outStream = fs.createWriteStream(histPath);
                outStream.on('finish', function() {
                    this.shutdown();
                }.bind(this));

                history.forEach(function(item) {
                    outStream.write(item + '\n');
                });
            } else {
                this.shutdown();
            }
        }.bind(this));
    },
    loadHistory: function(callback) {
        if(fs.existsSync(histPath)) {
            callback(fs.readFileSync(histPath).toString().split('\n'));
        } else {
            callback([]);
        }
    },
    performUserSelector: function(selector, value, resolve, reject) {
        var arr = false,
            bot = false,
            user;
        switch(selector) {
            case 'id':
                if(value === 'bot') {
                    bot = true;
                }
                break;
            case 'name':
                break;
            case 'fuzzyName':
                arr = true;
                break;
            default:
                this.bot.logger.warning('ShellAdapter', 'Rejecting non-standard selector ' + selector);
                reject({
                    'message': 'Unknown selector ' + selector
                });
                break;
        }
        if(bot) {
            user = this.botUser;
        } else {
            user = new User(this.bot, value + 'FakeUser', true);
        }
        resolve(arr ? [user] : user);
    },
    performChannelSelector: function(selector, value, resolve, reject) {
        switch(selector) {
            case 'id':
                break;
            case 'name':
                break;
            default:
                this.bot.logger.warning('ShellAdapter', 'Rejecting non-standard selector ' + selector);
                reject({
                    'message': 'Unknown selector ' + selector
                });
                break;
        }
        var channel = new Channel(this.bot, value + 'FakeChannel');
        resolve(channel);
    }
};

BaseAdapter.setup(ShellAdapter);

module.exports = ShellAdapter;
