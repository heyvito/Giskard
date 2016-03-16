var bot = require('../bot').sharedInstance();

/**
 * Represents an wrapped response object
 * @param {Object}          envelope    Envelope dynamic object containing
 *                                      message information
 * @param {Array<String>}   match       Array of matches from the message regex
 *
 * @property {Array<String>} match      Array of matches from the message regex
 * @property {Envelope}      envelope   This response {Envelope} instance
 * @property {User}          user       The {User} who sent the message that
 *                                      generated this Response instance
 * @property {Channel}      channel     {Channel} from which this message came
 * @property {String}       text        This message's content
 *
 * @constructor
 */
var Response = function(envelope, match) {
    this.envelope = envelope;
    this.text = envelope.text;
    this.match = match;
    this.user = envelope.user;
    this.channel = envelope.channel;
};

Response.prototype = {
    /**
     * Replies the incoming message
     * @param  {String}     string      String to be sent back to the user
     * @return {undefined}              Nothing
     */
    send: function(string) {
        bot.adapter.send(this.envelope, string);
    },

    /**
     * Replies the incoming message mentioning the user if necessary
     * @param  {String}     string      String to be sent back to the user
     * @return {undefined}              Nothing
     */
    reply: function(string) {
        bot.adapter.reply(this.envelope, string);
    },

    /**
     * Sets the propagation status to allowed, which allows the next handler
     * to try to process the incoming message
     * @return {undefined}          Nothing
     */
    allowPropagation: function() {
        this.envelope.allowPropagation();
    },

    ask: function(message, type) {
        var extra = Array.prototype.slice.apply(arguments, []).slice(2),
            args = [message, this.user, this.channel, type].concat(extra);
        return bot.contextManager.pushContext.apply(bot.contextManager, args);
    },

    sendTyping: function() {
        return bot.adapter.sendTypingState.apply(bot.adapter, [this]);
    },

    /**
     * Adds an reaction to this message. This feature depends on the current adapter implementation
     * and will be rejected by default.
     * @param {String} reactionName Emoji name to be added to the message.
     * @return {Promise}            A Promise that will be resolved after the reaction has been
     *                              added to the target message. Again, notice that this feature
     *                              depends on the current Adapter being used and will be rejected
     *                              by default.
     */
    addReaction: function(reactionName) {
        return bot.adapter.addReaction.apply(bot.adapter, [this.envelope, reactionName]);
    }
};

module.exports = Response;
