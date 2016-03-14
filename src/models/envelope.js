var Envelope = function(text, message, user, channel) {
    this.text = text;
    this.message = message;
    this.user = user;
    this.channel = channel;
    this.stopPropagation = false;
};

Envelope.prototype = {
    allowPropagation: function() {
        this.stopPropagation = false;
    }
};

module.exports = Envelope;
