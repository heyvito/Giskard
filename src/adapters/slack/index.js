var RtmClient = require('@slack/client').RtmClient,
    WebClient = require('@slack/client').WebClient,
    CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS,
    RTM_EVENTS = require('@slack/client').RTM_EVENTS;

var BaseAdapter = require('../../base_adapter'),
    settings = require('../../models/settings').sharedInstance(),
    logger = require('../../utils/logger')('SlackAdapter');

var SlackAdapter = function(bot) {
    BaseAdapter.call(this, bot);
    this.users = {};
    this.channels = {};
    this.dms = {};
    this.dmForUser = {};
};

SlackAdapter.prototype = {
    setup: function() {
        return new Promise((resolve, reject) => {
            if(!settings.token) {
                logger.error('Cannot use SlackAdapter without a proper token defined in your settings file.');
                reject();
            }
            this.web = new WebClient(settings.token);
            this.rtm = new RtmClient(settings.token);
            this.rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (data) => {
                data.ims.forEach(d => {
                    this.dms[d.id] = d;
                    this.dmForUser[d.user] = d;
                });
                this.bot.mentionMarks = [`<@${data.self.id}>`, data.self.name].concat(settings.nicknames);
                this.bot.name = data.self.name;
                var proms = [];
                proms = proms.concat(data.channels.map(c => {
                    return this.db.Channel.fromSlackData(c)
                        .then((c) => {
                            this.channels[c.id] = c;
                        });
                }));
                proms = proms.concat(data.groups.forEach(g => {
                    return this.db.Channel.fromSlackData(g)
                        .then((g) => {
                            this.channels[g.id] = g;
                        });
                }));
                proms = proms.concat(data.users.forEach(u => {
                    this.db.User.fromSlackData(u)
                        .then((u) => {
                            this.users[u.id] = u;
                        });
                }));
                Promise.all(proms)
                    .then(resolve)
                    .catch(reject);
            });
            this.rtm.start();
        });
    },
    run: function() {
        if(!this.messageEventSet) {
            this.rtm.on(RTM_EVENTS.MESSAGE, (message) => {
                if(message.type !== 'message' || !!message.subtype) { return; }
                if(message.channel[0] === 'D') {
                    message.text = this.bot.name + ': ' + message.text;
                }
                var env = this.makeEnvelope(message.text, message, this.users[message.user], this.channels[message.channel] || this.dms[message.channel]);
                this.receive(env);
            });
            this.messageEventSet = true;
        }
    },
    dmForUser: function(u) {
        if(typeof u !== 'string') {
            u = u.id;
        }
        return this.dmForUser[u];
    },
    channelIdForChannel: function(c) {
        return c.id ? c.id : c;
    },
    contextlessSend: function(target, string) {
        var id;
        if(target.id[0] === 'U') {
            id = this.dmForUser(target.id);
        } else {
            id = target.id;
        }
        if(!id) {
            logger.warning('Cannot determine target for item:');
            logger.warning(target);
            return Promise.reject();
        } else {
            return new Promise((resolve) => {
                this.rtm.sendMessage(string, id, function(d) {
                    resolve(d);
                });
            });
        }
    },
    send: function(envelope, string) {
        return new Promise((resolve) => {
            this.rtm.sendMessage(string, envelope.channel.id, (e, d) => {
                resolve(d);
            });
        });
    },
    reply: function(envelope, string) {
        if(envelope.channel.id[0] !== 'D') {
            var breaksLine = string.trim()[0] === '>' ? '\n' : ' ';
            string = '<@' + envelope.user.id + '>:' + breaksLine + string;
        }
        return this.send(envelope, string);
    },
    getMentionTagForUser: function(user) {
        return '<@' + user.id + '>';
    },
    removeMessage: function(messageId, channel) {
        return this.web.chat.delete(messageId, channel);
    },
    messageShouldBeUsedInContext: function(envelope) {
        if(envelope.channel.id[0] !== 'D') {
            return this.bot.inputManager.doesTextDirectlyMentionBot(envelope.text);
        } else {
            return true;
        }
    },
    sendTypingState: function(envelope) {
        var channel = envelope.channel;
        if(typeof channel === 'object') {
            channel = channel.id;
        }
        this.rtm.sendTyping(channel);
    },
    addReaction: function(envelope, reaction) {
        var channel = envelope.channel.id,
            ts = envelope.message.ts;
        return new Promise((resolve, reject) => {
            this.web.reactions.add(reaction, {
                channel: channel,
                timestamp: ts
            }, (err, res) => {
                if(err || !res.ok) {
                    return reject(res);
                };
                resolve();
            });
        });
    }
};

BaseAdapter.setup(SlackAdapter);

module.exports = SlackAdapter;
