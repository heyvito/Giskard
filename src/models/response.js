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
    }
};

module.exports = Response;
