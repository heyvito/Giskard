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
        return new (Function.prototype.bind.apply(Envelope, args)); // jshint ignore:line
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
    getMentionTagForUser: function(user) {
        return '@' + user.name;
    },

    removeMessage: function(messageId) {
        return Promise.reject();
    },

    messageShouldBeUsedInContext: function(envelope) {
        return true;
    },
    searchChannel: function(nameOrId) {
        return this.bot.adapter.searchChannel(nameOrId);
    },
    searchUser: function(nameOrId) {
        return this.bot.adapter.searchUser(nameOrId);
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
