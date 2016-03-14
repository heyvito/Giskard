var bot = require('./bot').sharedInstance(),
    inherit = require('./utils/inherit'),
    Context = require('./models/context'),
    rp = require('request-promise'),
    _ = require('lodash'),
    Cron = require('cron').CronJob;

/**
 * Represents the base module to every module
 * @param {Bot}     bot     The current bot instance
 * @constructor
 */
var BaseModule = function() {
    this.bot = bot;
    this.Context = Context;
    this.logger = require('./utils/logger')(this._meta.moduleName);
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
    },
    scheduleTask: function(givenSchedule) {
        givenSchedule = givenSchedule || {};
        var schedule = {
            minute: '*',
            hour: '*',
            monthDay: '*',
            month: '*',
            dayOfWeek: '*'
        };
        if(typeof schedule === 'object') {
            schedule = _.merge(schedule, givenSchedule);
            schedule = Object.keys(schedule).map(k => schedule[k]).join(' ');
        } else {
            schedule = givenSchedule;
        }

        return new Promise((resolve, reject) => {
            try {
                var job = new Cron(schedule, resolve, null, true);
            } catch(ex) {
                this.logger.warning('Error processing Cron job: ');
                this.logger.warning(ex);
                reject(ex);
            }
        });
    }
};

BaseModule.setup = function(klass, prettyKlassName) {
    inherit(klass, BaseModule);
    klass.prototype._meta = { className: prettyKlassName };
};

module.exports = BaseModule;
