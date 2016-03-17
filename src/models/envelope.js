
/**
 * Represents an Envelope object, responsible for holding metadata of an incoming message.
 * @param {String}      text    Incoming text of the messsage. May have been changed by the
 *                              active adapter. This value will be used by all subsystems
 *                              responsible for parsing and matching input data.
 * @param {AnyObject}   message Original adapter message object.
 * @param {AnyObject}   user    User who sent this message.
 * @param {AnyObject}   channel Channel where this message was sent.
 */
var Envelope = function(text, message, user, channel) {
    this.text = text;
    this.message = message;
    this.user = user;
    this.channel = channel;
    this.stopPropagation = false;
};

Envelope.prototype = {

    /**
     * Indicates underlaying mechanisms that the parsing of this message should continue.
     * Upstream mechanisms automatically voids messages; use this if your module is supposed
     * to let the message continue traversing the matching chain.
     * @return {undefined}              Nothing.
     */
    allowPropagation: function() {
        this.stopPropagation = false;
    }
};

module.exports = Envelope;
