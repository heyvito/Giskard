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
    this.logger = require('./utils/logger')(this._meta.className);
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

    /**
     * Sets a listener to a given regex whenever the bot is mentioned.
     * @param  {RegExp}   regex     Regex to be tested
     * @param  {Function} callback  Callback to be executed whenever a received message
     *                              matches the provided Regex. Please notice that this
     *                              function must be declared using the arrow syntax. (=>)
     * @return {Module}             This module instance.
     * @chainable
     */
    respond: function() {
        bot.inputManager.registerMentionInputHandler.apply(bot.inputManager, arguments);
        return this;
    },

    /**
     * Registers a listener to every message, including ones that does not
     * mentions the bot.
     * @param  {RegExp}     regex       Regex to be tested against every incoming
     *                                  message
     * @param  {Function}   callback    Callback to be executed whenever a message
     *                                  matches the provided regex.Please notice that this
     *                                  function must be declared using the arrow syntax. (=>)
     * @return {Module}                 This module instance.
     * @chainable
     */
    hear: function() {
        bot.inputManager.registerInputHandler.apply(bot.inputManager, arguments);
        return this;
    },

    /**
     * Checks if a given text mentions the bot.
     * @param  {String}     text     Text to be checked
     * @return {Bool}                Whether the given text mentions the bot.
     */
    mentionsBot: function() {
        return bot.inputManager.doesTextMentionBot.apply(bot.inputManager, arguments);
    },

    /**
     * Pushes a new context to a given user in a given channel. If another context
     * with the same type is present in the given channel/user combination, the older
     * context is dropped in favour of the new one. The `Promise` returned will be resolved
     * whenever the user sends a message that satisfies the context type. Notice that the
     * resulting Promise will never be rejected, but can also never be resolved.
     * @param   {String}            message         The message containing the prompt to the user.
     * @param   {User|String}       user            The user to which the prompt is directed to.
     *                                              This argument accepts both a User instance, or
     *                                              their ID used by the current Adapter to
     *                                              identify them.
     * @param   {Channel|String}    channel         The channel to which the prompt is directed to.
     *                                              This argument accepts both a Channel instance,
     *                                              or their ID used by the current Adapter to
     *                                              identify them.
     * @param   {Integer}           type            The type of context to be pushed to the user.
     *                                              These types are defined in the `Context` object,
     *                                              and have, actually, three possible values:
     *                                              1. `Context.NUMBER`: Matches any message
     *                                              compound by a sequence of one or more numbers.
     *                                              2. `Context.BOOLEAN`: Matches any message
     *                                              that represents an affirmative or negative
     *                                              value. The regular expression used to match
     *                                              the message is defined in the very same `Context`
     *                                              class.
     *                                              3. `Context.REGEX`: Matches any message that
     *                                              matches a given regular expression.
     * @param   {Regex}             [regex]         Regular expression to be used when type is
     *                                              `Context.REGEX`.
     * @return  {Promise}                           A Promise that will be resolved whenever the bot
     *                                              receives a response from the target user in the
     *                                              target channel. The resulting promise argument
     *                                              will be an `Response` object, in which
     *                                              `response.match` will represent the parsed value
     *                                              of this context. For instance, with a type of
     *                                              `BOOLEAN`, `Response.match` can either be `true`
     *                                              or `false`, representing the answer of the user.
     */
    ask: function() {
        return bot.contextManager.pushContext.apply(bot.contextManager, arguments);
    },

    /**
     * Executes an HTTP request with the given arguments. This function is a proxy
     * to the Request-Promise library. See more: https://github.com/request/request-promise
     * @return {Promise}        A Promise returned by the Request-Promise library.
     */
    http: function() {
        return rp.apply(rp, arguments);
    },

    /**
     * Searches a channel with the given name or ID, where the ID must be a identifier used by
     * the current Adapter to internally represent known channels.
     * @param {String}      nameOrId            Name or ID of the channel to be found.
     * @return {Promise}                        A promise that will be resolved whenever the channel
     *                                          is found. It will be rejected whenever the channel
     *                                          cannot be found or there's an underlying problem
     *                                          during the search process.
     */
    searchChannel: function() {
        return bot.adapter.searchChannel.apply(bot.adapter, arguments);
    },

    /**
     * Searches an user with the given name or ID, where the ID must be a identifier used by
     * the current Adapter to internally represent known channels.
     * @param {String}      nameOrId            Name or ID of the user to be found.
     * @return {Promise}                        A promise that will be resolved whenever the user
     *                                          is found. It will be rejected whenever the user
     *                                          cannot be found or there's an underlying problem
     *                                          during the search process.
     */
    searchUser: function(usernameOrId) {
        return bot.adapter.searchUser.apply(bot.adapter, arguments);
    },

    /**
     * Executes a given function with base on a given Cron schedule.
     * @param  {String|Object}   givenSchedule      A crontab pattern that defines whenever the
     *                                              associated function will be invoked. For
     *                                              further information on this pattern, please
     *                                              refer to cron(5) manpage. Another possible
     *                                              value for this argument, is an object with
     *                                              properties `minute`, `hour`, `monthDay`, `month`,
     *                                              `dayOfWeek`. Missing properties will receive `*`
     *                                              as value. Again, refering to cron(5) is essential.
     * @param  {Function}        callback           Function to be called whenever the provided
     *                                              schedule is met.
     * @return {Module}                             This very same module instance.
     * @chainable
     */
    scheduleTask: function(givenSchedule, callback) {
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

        var job = new Cron(schedule, callback, null, true);
        return this;
    }
};


/**
 * Extends an given type to this type
 * @param  {Type}   klass               Type to be extended
 * @param  {String} prettyKlassName     Name of this moduled, used by subsystems to provide
 *                                      identification facilities.
 * @return {undefined}      Nothing
 */
BaseModule.setup = function(klass, prettyKlassName) {
    inherit(klass, BaseModule);
    klass.prototype._meta = { className: prettyKlassName };
};

module.exports = BaseModule;
