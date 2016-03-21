var express = require('express'),
    Path = require('path'),
    socketio = require('socket.io'),
    HTTP = require('http');


var BaseAdapter = require('../../base_adapter'),
    logger = require('../../utils/logger')('DebugAdapter'),
    SocketModel = require('./socket'),
    UrlChecker = require('./url_checker');

var DebugAdapter = function(bot) {
    BaseAdapter.call(this, bot);
    this.express = express()
        .use(express.static(Path.join(__dirname, 'public')))
        .get('/', (req, res) => {
            res.sendfile(__dirname + '/views/channel/index.html');
        });
    this.http = HTTP.Server(this.express);
    this.io = new socketio(this.http);
    this.users = [];
    this.channelName = '__debug_channel';
    this.urlChecker = new UrlChecker();
}

DebugAdapter.prototype = {
    setup: function() {
        return new Promise((resolve, reject) => {
            this.io.on('connection', (socket) => {
                this.users.push(new SocketModel(this, socket));
            });
            this.bot.mentionMarks = ['@giskard', 'giskard', 'bot'];
            this.bot.name = 'giskard';

            this.db.Channel.fromSlackData({
                id: this.channelName,
                name: 'debug',
                is_archived: false,
                is_member: true
            }).then((c) => {
                this.channelModel = c;
                resolve();
            }).catch(reject);
        });
    },
    run: function() {
        this.http.listen(2709, () => {
            logger.warning('DebugAdapter HTTP interface is ready on port 2709');
        });
    },
    dmForUser: function(u) {
        return this.channelName;
    },
    channelIdForChannel: function(c) {
        return c.id ? c.id : c;
    },
    getMentionTagForUser: function(user) {
        return '@' + user.username;
    },
    removeMessage: function(messageId, channel) {
        this.io.emit('delete_message', {
            ts: messageId
        });
        return Promise.resolve();
    },
    messageShouldBeUsedInContext: function(envelope) {
        return true;
    },
    sendTypingState: function(envelope) {
        this.io.emit('bot_is_typing');
    },
    addReaction: function(envelope, reaction) {
        this.io.emit('add_reaction_to', {
            id: envelope.message.ts,
            reaction: reaction
        });
        return Promise.resolve();
    },
    contextlessSend: function(target, string) {
        var what,
            channel = null;
        if (target.indexOf && target.indexOf('__debug_user') === 0) {
            what = 'user';
        } else {
            what = 'channel';
            channel = target.name;
        }
        var ts = Date.now();
        this.io.emit('bot_said', {
            to: what,
            message: string,
            target: target,
            channel: channel,
            ts: ts
        });
        this.checkForMetadata(string, ts);
        return Promise.resolve({ ts: ts });
    },
    send: function(envelope, string) {
        var ts = Date.now();
        this.io.emit('bot_said', {
            to: 'channel',
            message: string,
            ts: ts
        });
        this.checkForMetadata(string, ts);
        return Promise.resolve({ ts: ts });
    },
    reply: function(envelope, string) {
        var initialChars = string.trim().substr(0, 3);
        var breaksLine = initialChars.indexOf('>') === 0 || initialChars.indexOf('```') === 0;
        string = '@' + envelope.user.username + ':' + (breaksLine ? '\n' : '') + string;
        return this.send(envelope, string);
    },
    checkForMetadata: function(text, ts) {
        var proms = [];
        (text + '').replace(/(https?:\/\/[^\s]+)/g, (u) => {
            proms.push(this.urlChecker.checkUrl(u, ts));
            return '';
        });
        Promise.race(proms)
            .then((meta) => {
                this.io.emit('extra_metadata', meta);
            });
    },
    searchChannel: function(nameOrId) {
        var c = new this.db.Channel({
            name: nameOrId,
            id: nameOrId,
        });
        c.save = function() { };
        return Promise.resolve(c);
    }
};

BaseAdapter.setup(DebugAdapter);
module.exports = DebugAdapter;
