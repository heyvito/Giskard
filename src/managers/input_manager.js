var logger = require('../utils/logger')('InputManager'),
    bot = require('../bot').sharedInstance(),
    MessageComparator = require('../models/message_comparator'),
    Inflector = require('../utils/inflector');

/**
 * Represents an object capable of handling user input from a chat source, coming from
 * an Adapter instance.
 * @constructor
 */
var InputManager = function() {
    this.listeners = [];
    return this;
};

InputManager.prototype = {

    /**
     * Escapes a given string to be compatible with a regular expression, ensuring that its
     * contents does not conflicts with the expression it will be injected into.
     * @param  {String} regex String to be escaped.
     * @return {String}       String properly escaped to be injected into a regular expression.
     */
    escapeRegex: function(regex) {
        return regex.replace(/[-[\]{}()*+?.,\\^$|#\s<>]/g, '\\$&');
    },

    /**
     * Processes an incoming envelope, and checks if it matches an existing context, or satisfies
     * an regular expression defined by a module. If one of those conditions is satisfied, the
     * associated function or promise is resolved, and the envelope is voided. If a module
     * handler is called, it may reset the Envelope's void state, forcing it to be tested
     * against other modules.
     * @param  {Envelope} envelope Envelope to be tested
     * @return {undefined}                      Nothing.
     */
    process: function(envelope) {
        if(bot.contextManager.checkMessage(envelope)) {
            return;
        }
        Inflector.getInstance(envelope.text)
            .normaliseInput()
            .catch(ex => {
                logger.error('Inflection failed: ');
                logger.error(ex);
                return envelope.text;
            })
            .then(i => {
                logger.silly(`Inflection result: ${i}`);
                envelope.normalisedText = i;
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
            });
    },

     /**
     * Sets a listener to a given regex whenever this bot is mentioned
     * @param  {RegExp}   regex     Regex to be tested
     * @param  {Function} callback  Callback to be executed whenever a received message
     *                              matches the provided Regex
     * @return {InputManager}       This manager instance.
     * @chainable
     */
    registerMentionInputHandler: function(moduleName, regex, callback) {
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
        this.listeners.push(new MessageComparator(moduleName, newRegex, callback));
        return this;
    },

    /**
     * Registers a listener to every message, including ones that does not
     * mentions this bot.
     * @param  {RegExp}     regex       Regex to be tested against every incoming
     *                                  message
     * @param  {Function}   callback    Callback to be executed whenever a message
     *                                  matches the provided regex.
     * @return {Bot}                    This Bot instance
     * @chainable
     */
    registerInputHandler: function(moduleName, regex, callback) {
        this.listeners.push(new MessageComparator(moduleName, regex, callback));
    },

    /**
     * Checks if an incoming text mentions the bot in any part of the text.
     * @param  {String} data    Text to be checked.
     * @return {Boolean}        Whether the text mentions the bot.
     */
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

    /**
     * Checks if a given directly mentions the bot. This is, if the mention appears before the
     * content itself.
     * @param  {String} data    Text to be checked.
     * @return {Boolean}        Whether the text directly mentions the bot.
     */
    doesTextDirectlyMentionBot: function(data) {
         var result = false;
        if(!!data) {
            data = (data + '').toLowerCase();
            result = [bot.name]
                .concat(bot.mentionMarks)
                .some(a => data.indexOf(a.toLowerCase()) === 0);
        }
        return result;
    },

    /**
     * Suspends a set of comparators of a given module
     * @param  {String} name Name of the module to be suspended
     * @return {undefined}      Nothing
     * @since 2.0
     */
    suspendComparatorsForModuleNamed: function(name) {
        this.listeners
            .filter(l => l.moduleName === name)
            .forEach(l => l.setSuspensionState(true));
    },

    /**
     * Resumes a set of comparators of a given module
     * @param  {String} name Name of the module to be resumed
     * @return {undefined}      Nothing
     * @since 2.0
     */
    resumeComparatorsForModuleNamed: function(name) {
        this.listeners
            .filter(l => l.moduleName === name)
            .forEach(l => l.setSuspensionState(false));
    },

    /**
     * Removes all comparators of a given module
     * @param  {String} name Name of the module to have its comprators removed
     * @return {undefined}      Nothing
     * @since 2.0
     */
    purgeComparatorsForModuleNamed: function(name) {
        this.listeners = this.listeners
            .filter(l => l.moduleName !== name)
    }
};

module.exports = InputManager;
