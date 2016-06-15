var db = require('../utils/db'),
    bot = require('../bot').sharedInstance(),
    Response = require('../models/response'),
    logger = require('../utils/logger')('ContextManager');

/**
 * Represents an object capable of managing Contexts pushed by modules.
 * @constructor
 */
var ContextManager = function() {
    this.queue = [];
    return this;
};

ContextManager.prototype = {

    /**
     * Cleans up any dangling context known in the database.
     * @return {undefined}                          Nothing.
     */
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

    /**
     * Registers a Context with a given message and pushes it to the watcher queue.
     * @param  {Message} message Message object representing the prompt.
     * @return {undefined}                                      Nothing.
     */
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

    /**
     * Normalises a database or adapter-related object that contains an identifier.
     * @param  {Object}     v           String or object containing an ID property.
     * @return {String}                 `v` itself when `v` is a String; otherwise, v.id, even
     *                                  if v.id is undefined.
     */
    normaliseObject: function(v) {
        return typeof v === 'string' ? v : v.id;
    },

    /**
     * Checks an incoming message for whether it satisfies an enqueued Context. When the condition
     * is truthy, the envelope is voided and the underlying promise is resolved.
     * @param  {Envelope} envelope      The incoming message data
     * @return {Boolean}                Whether the envelope has been voided.
     */
    checkMessage: function(envelope) {
        var normalisedChannel = this.normaliseObject(envelope.channel),
            normalisedUser = this.normaliseObject(envelope.user),
            result = false;

        var comparator = i => i.channel === normalisedChannel && i.user === normalisedUser;

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

    /**
     * Pushes a new context with a given message, user, channel and type. This discards any
     * other context of the same type for the same user/channel combination.
     * @param  {String}         message Message to be sent to the target user in the target channel.
     * @param  {User|String}    user    Target user to receive the message. Can either be an User
     *                                  instance or the ID used by the Adapter to identify the target
     *                                  user.
     * @param  {Channel|String} channel Channel to where the message will be sent to. Can either be
     *                                  a Channel instance, or the ID used by the Adapter to identify
     *                                  the target channel.
     * @param  {Integer}        type    Type of context to be pushed. Types are defined in the Context
     *                                  model and can be `Context.NUMBER`, `Context.BOOLEAN`, or
     *                                  `Context.REGEX`. Documentation about those items and how
     *                                  they behave can be found in the `Context` documentation.
     * @return {Promise}                A Promise that will be resolved whenever the target user
     *                                  replies to the prompt in the given Channel. This promise
     *                                  cannot be rejected, but it may never be resolved, given that
     *                                  it will be invalidated if a new Context with the same
     *                                  combination of User/Channel/Type is pushed.
     */
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
        var attachment = [
            {
                "text": '*Protip*: Adicione :-1: como reaction para cancelar uma pergunta',
                "mrkdwn_in": ["text"]
            }
        ];
        return new Promise((resolve, reject) => {
            bot.adapter.reply({
                channel: channel,
                user: user
            }, message, attachment).then((mi) => {
                this.registerContext({
                    messageCallback: mi,
                    type: type,
                    user: typeof user === 'string' ? user : user.id,
                    channel: typeof channel === 'string' ? channel : channel.id,
                    resolve: resolve,
                    reject: reject
                });
            });
        });
    },

    /**
     * Handles a REACTION_ADDED event for a given message. Used to reject and
     * notify context promises that the user has cancelled or refused to answer
     * the question by using an emoji reaction.
     * @param  {Object}     data                Message metadata preprocessed
     *                                          by the current adapter
     * @return {undefined}                      Nothing
     * @private
     * @since  2.1
     */
    handleReactionAdded: function(data) {
        if(['thumbs_down', 'thumbsdown', '-1'].indexOf(data.reaction) === -1) {
            logger.debug(`Ignoring unknown reaction ${data.reaction} on event:`);
            logger.debug(data);
            return;
        }
        this.queue
            .filter(c => c.reference.uid === data.initiator && c.reference.ts === data.ts)
            .forEach(c => {
                logger.debug(`Rejecting stored context ${c.reference._id}`);
                c.reject();
                this.queue.splice(this.queue.indexOf(c), 1);
            });
        db.Context
            .find({ uid: data.initiator, ts: data.ts })
            .remove()
            .then((data, err) => {
                if(!err && data.result && data.result.ok) {
                    logger.silly(`Removed ${data.result.n} stored references(s)`);
                } else {
                    logger.warning('Stored context reference removal failed.');
                }
            });
    }
};

module.exports = ContextManager;
