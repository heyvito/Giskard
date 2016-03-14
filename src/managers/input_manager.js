var logger = require('../utils/logger')('InputManager'),
    bot = require('../bot').sharedInstance(),
    MessageComparator = require('../models/message_comparator');

var InputManager = function() {
    this.listeners = [];
    return this;
};

InputManager.prototype = {
    escapeRegex: function(regex) {
        return regex.replace(/[-[\]{}()*+?.,\\^$|#\s<>]/g, '\\$&');
    },
    process: function(envelope) {
        if(bot.contextManager.checkMessage(envelope)) {
            return;
        }
        this.listeners.every((listener) => {
            try {
                listener.call(envelope);
                if(envelope.stopPropagation) {
                    return false;
                }
            } catch(ex) {
                logger.error(ex);
            }
            return true;
        });
    },
    registerMentionInputHandler: function(regex, callback) {
        var re = regex.toString().split('/');
        re.shift();
        var modifiers = re.pop();

        if(re[0] && re[0][0] === '^') {
            logger.warning('Anchors do not work well with respond, perhaps you want to use \'hear\'');
            logger.warning('The Regular Expression in question was %s', regex.toString());
        }

        var pattern = re.join('/'),
            aliasSeparator = '[:,]?|',
            name = this.escapeRegex(bot.name),
            alias = bot.mentionMarks.map(m => this.escapeRegex(m)).join(aliasSeparator),
            newRegex = new RegExp(['^\\s*(?:', alias, aliasSeparator, name, '[:,]?)\\s*(?:', pattern, ')'].join(''), modifiers);
        this.listeners.push(new MessageComparator(this, newRegex, callback));
        return this;
    },
    registerInputHandler: function(regex, callback) {
        this.listeners.push(new MessageComparator(regex, callback));
    },
    doesTextMentionBot: function(data) {
        var result = false;
        if(!!data) {
            data = (data + '').toLowerCase();
            result = [bot.name]
                .concat(bot.mentionMarks)
                .some(a => data.indexOf(a.toLowerCase()) > -1);
        }
        return result;
    },
    doesTextDirectlyMentionBot: function(data) {
         var result = false;
        if(!!data) {
            data = (data + '').toLowerCase();
            result = [bot.name]
                .concat(bot.mentionMarks)
                .some(a => data.indexOf(a.toLowerCase()) === 0);
        }
        return result;
    }
};

module.exports = InputManager;
