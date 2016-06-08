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
    this.dmMap = {};
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
                    this.dmMap[d.user] = d;
                });
                this.bot.mentionMarks = [`<@${data.self.id}>`, data.self.name].concat(settings.nicknames);
                this.bot.name = data.self.name;
                var proms = [];
                proms = proms.concat(data.channels
                    .filter(c => !c.is_archived)
                    .map(c => {
                        return this.db.Channel.fromSlackData(c)
                            .then((c) => {
                                this.channels[c.id] = c;
                            });
                    }));
                proms = proms.concat(data.groups
                    .filter(g => !g.is_archived)
                    .forEach(g => {
                        return this.db.Channel.fromSlackData(g)
                            .then((g) => {
                                this.channels[g.id] = g;
                            });
                    }));
                proms = proms.concat(data.users.forEach(u => {
                    return this.db.User.fromSlackData(u)
                        .then((u) => {
                            this.users[u.id] = u;
                        });
                }));
                data.users.forEach(u => {
                    if(!data.ims.some(i => i.user === u.id) && !u.deleted && !u.is_bot) {
                        logger.verbose(`Acquiring extra data for user ${u.id}`);
                        var p = this.web.dm.open(u.id)
                            .then(r => {
                                logger.verbose(`Acquired extra data for user ${u.id}`);
                                this.dms[r.channel.id] = { id: r.channel.id };
                                this.dmMap[u.id] = { id: r.channel.id };
                            });
                        proms.push(p);
                    }
                });
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
                if(!this.users[message.user]) {
                    logger.verbose(`Acquiring extra data for unknown user: ${message.user}`);
                    this.web.users.info(message.user)
                        .then(response => this.db.User.fromSlackData(response.user))
                        .then(user => {
                            return this.web.dm.open(user.id)
                                .then(r => {
                                    logger.verbose(`Acquired extra data for user ${user.id}`);
                                    this.dms[r.channel.id] = { id: r.channel.id };
                                    this.dmMap[u.id] = { id: r.channel.id };
                                    this.users[message.user] = user;
                                })
                                .then(() => {
                                    var env = this.makeEnvelope(message.text, message, this.users[message.user], this.channels[message.channel] || this.dms[message.channel]);
                                    this.receive(env);
                                });
                        })
                        .catch(ex => {
                            logger.error('Error acquiring extra data: ');
                            logger.error(ex);
                        })
                } else {
                    var env = this.makeEnvelope(message.text, message, this.users[message.user], this.channels[message.channel] || this.dms[message.channel]);
                    this.receive(env);
                }
            });
            this.messageEventSet = true;
        }
    },
    dmForUser: function(u) {
        if(typeof u !== 'string') {
            u = u.id;
        }
        return this.dmMap[u];
    },
    channelIdForChannel: function(c) {
        return c.id ? c.id : c;
    },
    contextlessSend: function(target, string, attachments) {
        var id;
        if(target.id && target.id[0] === 'U') {
            id = this.dmForUser(target.id);
            if(!!id.id) {
                id = id.id;
            }
        } else if(target.id) {
            id = target.id;
        } else {
            id = target;
        }
        if(!id) {
            logger.warning('Cannot determine target for item:');
            logger.warning(target);
            return Promise.reject();
        } else {
            return new Promise((resolve) => {
                if(!attachments) {
                    this.rtm.sendMessage(string, id, function(d) {
                        resolve(d);
                    });
                } else {
                    this.web.chat.postMessage(id, string, { attachments: attachments }, (e, d) => {
                        if(d) {
                            resolve(d);
                        }
                    });
                }
            });
        }
    },
    send: function(envelope, string, attachments) {
        return new Promise((resolve) => {
            if(!attachments) {
                this.rtm.sendMessage(string, envelope.channel.id, (e, d) => {
                    resolve(d);
                });
            } else {
                var data = {
                    username: this.bot.name,
                    as_user: true,
                    attachments: attachments
                };
                this.web.chat.postMessage(envelope.channel.id, string, data, (e, d) => {
                    if(d) {
                        resolve(d);
                    }
                });
            }
        });
    },
    reply: function(envelope, string, attachments) {
        if(envelope.channel.id[0] !== 'D') {
            var initialChars = string.trim().substr(0, 3);
            var breaksLine = initialChars.indexOf('>') === 0 || initialChars.indexOf('```') === 0;
            string = '<@' + envelope.user.id + '>:' + (breaksLine ? '\n' : ' ') + string;
        }
        return this.send(envelope, string, attachments);
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
    },
    searchChannel: function(nameOrId) {
        if(nameOrId && nameOrId.indexOf('#') === 0) {
            nameOrId = nameOrId.replace('#', '');
        }
        return BaseAdapter.prototype.searchChannel.apply(this, [nameOrId]);
    },
    searchUser: function(nameOrId) {
        var r = /\<@([^>]+)\>/;
        if(r.test(nameOrId)) {
            nameOrId = r.exec(nameOrId)[1];
        }
        return BaseAdapter.prototype.searchUser.apply(this, [nameOrId]);
    }
};

BaseAdapter.setup(SlackAdapter);

module.exports = SlackAdapter;
