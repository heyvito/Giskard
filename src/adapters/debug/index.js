var express = require('express'),
    socketio = require('socket.io'),
    HTTP = require('http');


var BaseAdapter = require('../../base_adapter'),
    logger = require('../../utils/logger')('DebugAdapter'),
    SocketModel = require('./socket');

var DebugAdapter = function(bot) {
    BaseAdapter.call(this, bot);
    this.express = express();
    this.http = HTTP.Server(this.express);
    this.io = new socketio(this.http);
    this.users = [];
    this.channelName = '__debug_channel';
}

DebugAdapter.prototype = {
    setup: function() {
        return new Promise((resolve, reject) => {
            this.io.on('connection', (socket) => {
                this.users.push(new SocketModel(this, socket));
            });
            this.bot.mentionMarks = ['@giskard', 'giskard', 'bot'];
            this.bot.name = 'giskard';

            this.db.Channel.fromSlack({
                id: this.channelName,
                name: 'debug',
                is_archived: false,
                is_member: true
            }).then(resolve).catch(reject);
        });
    },
    run: function() {
        this.http.listen(2728, () => {
            logger.warning('DebugAdapter HTTP interface is ready on port 2728');
        });
    },
    dmForUser: function(u) {
        if(typeof u !== 'string') {
            u = u.id;
        }
        return u;
    },
    channelIdForChannel: function(c) {
        return c.id ? c.id : c;
    },
    getMentionTagForUser: function(user) {
        return '@' + user.username;
    },
    removeMessage: function(messageId, channel) {
        this.io.emit('delete_message', { ts: messageId });
        return Promise.resolve()
    },
    messageShouldBeUsedInContext: function(envelope) {
        return true;
    },
    sendTypingState: function(envelope) {
        this.io.emit('bot_is_typing');
    },
    addReaction: function(envelope, reaction) {
        this.io.emit('add_reaction_to', { id: envelope.message.ts, reaction: reaction });
        return Promise.resolve();
    },
    contextlessSend: function(target, string) {
        var what;
        if(target.indexOf('____debug_user') === 0) {
            what = 'user';
        } else {
            what = 'channel';
        }
        this.io.emit('bot_said', { to: what, message: string, target: target });
        return Promise.resolve();
    },
    send: function(envelope, string) {
        this.io.emit('bot_said', { to: 'channel', message: string });
        return Promise.resolve();
    },
    reply: function(envelope, string) {
        var breaksLine = string.trim()[0] === '>' ? '\n' : ' ';
        string = '@' + envelope.user.username + ':' + breaksLine + string;
        return this.send(envelope, string);
    }
};

BaseAdapter.setup(DebugAdapter);
module.exports = DebugAdapter;
