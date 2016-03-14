var bot = require('./bot').sharedInstance(),
    inherit = require('./utils/inherit'),
    Context = require('./models/context');

/**
 * Represents the base module to every module
 * @param {Bot}     bot     The current bot instance
 * @constructor
 */
var BaseModule = function() {
    this.bot = bot;
    this.Context = Context;
};

BaseModule.prototype = {
    /**
     * Gets a random item from an array.
     * @param  {Array}      arr     Array to be processed.
     * @return {AnyObject}          A random object from [arr]
     */
    random: function(arr) {
        if(!arr) {
            return undefined;
        }
        if(!arr.length) {
            return undefined;
        }
        if(arr.length < 2) {
            return arr[0];
        }
        return arr[Math.floor(Math.random() * arr.length)];
    },
    respond: function() {
        bot.inputManager.registerMentionInputHandler.apply(bot.inputManager, arguments);
        return this;
    },
    hear: function() {
        bot.inputManager.registerInputHandler.apply(bot.inputManager, arguments);
        return this;
    },
    mentionsBot: function() {
        return bot.inputManager.doesTextMentionBot.apply(bot.inputManager, arguments);
    },
    ask: function() {
        return bot.contextManager.pushContext.apply(bot.contextManager, arguments);
    },
    http: function() {
        return rp.apply(rp, arguments);
    },
    searchChannel: function() {
        return bot.adapter.searchChannel.apply(bot.adapter, arguments);
    },
    searchUser: function(usernameOrId) {
        return bot.adapter.searchUser.apply(bot.adapter, arguments);
    }
};

BaseModule.setup = function(klass) {
    inherit(klass, BaseModule);
};

module.exports = BaseModule;
