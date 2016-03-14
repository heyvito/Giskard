var db = require('../utils/db'),
    bot = require('../bot').sharedInstance(),
    Response = require('../models/response'),
    logger = require('../utils/logger')('ContextManager');

var ContextManager = function() {
    this.queue = [];
    return this;
};

ContextManager.prototype = {
    cleanUp: function() {
        logger.debug('Performing cleanup...');
        db.Context
            .find()
            .exec()
            .then((arr) => {
                arr.forEach(i => bot.adapter
                        .removeMessage(i.ts, i.cid)
                        .then(() => db.Context.remove({ ts: i.ts }))
                        .catch(ex => logger.warning('Failed to remove context: ' + ex.message))
                        );
            });
    },
    registerContext: function(message) {
        logger.debug('Registering context: ');
        logger.debug(message);
        db.Context
            .createWithMessage(message.messageCallback, message.user, message.channel)
            .then(i => {
                message.reference = i;
                logger.debug('Pushing message to queue...');
                this.queue.push(message);
            })
            .catch(ex => {
                logger.error('Error storing context: ');
                logger.error(ex);
                bot.adapter.removeMessage(message.messageCallback.ts);
            });
    },
    normaliseObject: function(v) {
        return typeof v === 'string' ? v : v.id;
    },
    checkMessage: function(envelope) {
        var normalisedChannel = this.normaliseObject(envelope.channel),
            normalisedUser = this.normaliseObject(envelope.user),
            result = false;

        var comparator = i => i.channel === normalisedChannel && i.user === normalisedUser;
        logger.debug('Checking message against queue:');
        logger.debug('Message:');
        logger.debug(envelope);
        logger.debug('------------------------------------');
        logger.debug(this.queue);

        if(this.queue.some(comparator)) {
            var items = this.queue.filter(comparator),
                text = envelope.text + '';

            if(bot.mentionMarks.some(m => envelope.text.toLowerCase().indexOf(m) === 0)) {
                bot.mentionMarks.forEach(i => { text = text.replace(i, ''); });
                text = text.trim();
                if(text.indexOf(':') === 0) {
                    text = text.replace(':', '').trim();
                }
            }

            items.forEach((item, index) => {
                if(!result) {
                    var comp = db.Context.comparatorFor(item.type),
                        args = [text].concat(item.extra || []);
                    var compResult = comp.apply(null, args);
                    if(compResult.valid && bot.adapter.messageShouldBeUsedInContext(envelope)) {
                        item.resolve(new Response(envelope, compResult.value));
                        item.reference.remove();
                        this.queue.splice(index, 1);
                        result = true;
                    }
                }
            });
        }
        return result;
    },
    pushContext: function(message, user, channel, type) {
        var extra = Array.prototype.slice.apply(arguments, []).slice(4);
        logger.debug('Pushing context: ');
        logger.debug({
            message: message,
            user: user,
            channel: channel,
            type: type,
            extra: extra
        });

        var conflicts = this.queue.filter((i) => i.user === this.normaliseObject(user) &&
                i.channel === this.normaliseObject(channel) &&
                i.type === type);

        if(conflicts.length) {
            logger.debug('Conflict detected.');
            conflicts.forEach(i => {
                i.reference.remove();
                this.queue.splice(this.queue.indexOf(i), 1);
            });
            logger.debug('Removed ' + conflicts.length + ' conflicting contexts');
        }

        return new Promise((resolve) => {
            bot.adapter.reply({
                channel: channel,
                user: user
            }, message).then((mi) => {
                this.registerContext({
                    messageCallback: mi,
                    type: type,
                    user: typeof user === 'string' ? user : user.id,
                    channel: typeof channel === 'string' ? channel : channel.id,
                    resolve: resolve
                });
            });
        });
    }
};

module.exports = ContextManager;
