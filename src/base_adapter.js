var _ = require('lodash'),
    EventEmitter = require('events'),
    inherit = require('./utils/inherit'),
    Envelope = require('./models/envelope');

/**
 * Represents a base adapter for all adapters
 * @param {Bot}     bot     The current {Bot} instance
 * @constructor
 */
var BaseAdapter = function(bot) {
    this.bot = bot;
    this.db = require('./utils/db');
};

BaseAdapter.prototype = {
    makeEnvelope: function() {
        var args = Array.prototype.slice.apply(arguments, []);
        args.unshift(undefined);
        return new (Function.prototype.bind.apply(Envelope, args));
    },

    setup: function() { return Promise.resolve(); },

    /**
     * Sends a contextless message to the chat source
     * @param  {AnyObject}  target  Destination of the message
     * @param  {String}     string  Message contents
     * @return {undefined}          Nothing
     */
    contextlessSend: function(target, string) { },

    /**
     * Sends an answer of an envelope
     * @param  {Envelope}   envelope    Envelope being answered
     * @param  {String}     string      Message contents
     * @return {undefined}              Nothing
     */
    send: function(envelope, string) { return Promise.reject(); },

    /**
     * Replies an envelope
     * @param  {Envelope}   envelope    Envelope being replied
     * @param  {String}     string      Message contents
     * @return {undefined}              Nothing
     */
    reply: function(envelope, string) { return this.send(envelope, string); },

    /**
     * Executes the adapter
     * @return {undefined}      Nothing
     */
    run: function() { this.ready(); },

    /**
     * Shutdowns the adapter
     * @return {undefined}      Nothing
     */
    shutdown: function() { },

    /**
     * Receives an message from the chat source
     * @param  {AnyObject}  message     Message being received
     * @return {undefined}              Nothing
     */
    receive: function(message) { this.bot.inputManager.process(message); },

    /**
     * Adds an event subscriber to a given event name
     * @param  {String}   event         Event name to be subscribed to
     * @param  {Function} callback      Callback function to be called whenever the event is emitted
     * @return {BaseAdapter}            This very same instance
     * @chainable
     */
    on: function(event, callback) {
        this.events.on(event, callback);
        return this;
    },

    /**
     * Performs a selector requested by a module using a given value
     * @param  {String}       selector    Selector name to be executed
     * @param  {AnyObject}    value       Value to be applied to the given selector
     * @param  {Function}     resolve     Function to be executed when the selector is
     *                                    successfully executed
     * @param  {Function}     reject      Function to be executed when the selector could
     *                                    not be executed
     * @return {undefined}                Nothing.
     */
    performUserSelector: function(selector, value, resolve, reject) {
        reject(new Error('The adapter in use has not implemented this selector.'));
    },

    /**
     * Performs a selector requested by a module using a given value
     * @param  {String}       selector    Selector name to be executed
     * @param  {AnyObject}    value       Value to be applied to the given selector
     * @param  {Function}     resolve     Function to be executed when the selector is
     *                                    successfully executed
     * @param  {Function}     reject      Function to be executed when the selector could
     *                                    not be executed
     * @return {undefined}                Nothing.
     */
    performChannelSelector: function(selector, value, resolve, reject) {
        reject(new Error('The adapter in use has not implemented this selector.'));
    },

    /**
     * Gets a string representing a mention to the giving {User}
     * @param  {User}       user        User to be mentioned
     * @return {String}                 String representing the mention tag for
     *                                  the giving user
     */
    getMentionTagForUser: function(user) {
        return '@' + user.name;
    },

    removeMessage: function(messageId) {
        return Promise.reject();
    },

    messageShouldBeUsedInContext: function(envelope) {
        return true;
    }
};

/**
 * Extends an given type to this type
 * @param  {Type}   type    Type to be extended
 * @return {undefined}      Nothing
 */
BaseAdapter.setup = (type) => {
    inherit(type, BaseAdapter);
};

module.exports = BaseAdapter;
