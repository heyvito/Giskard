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
    /**
     * Initialises a new instance of an `Envelope` passing the same arguments
     * provided to this function to its constructor.
     * @return {Envelope}       A new envelope with the given arguments.
     */
    makeEnvelope: function() {
        var args = Array.prototype.slice.apply(arguments, []);
        args.unshift(undefined);
        return new (Function.prototype.bind.apply(Envelope, args)); // jshint ignore:line
    },

    /**
     * Sets up this adapter.
     * @return {Promise}   A Promise that will be resolved whenever this adapter is done setting up
     *                     itself. This promise can be rejected if the operation fails.
     */
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
     * Gets a mention tag for the given user.
     * @param  {User}   user    User object to generate the tag from.
     * @return {String}         A string representing the tag that mentions the
     *                          user, considering the current adapter mechanics.
     */
    getMentionTagForUser: function(user) {
        return '@' + user.username;
    },

    /**
     * Removes a given message from the message log. This method depends on the current
     * adapter's implementation and capabilities. This implementation can also accept
     * other parameters and depends on the used adapter's mechanics.
     * @param  {String}     messageId   ID of the message to be removed.
     * @return {Promise}                A Promise that will be resolved whenever the message
     *                                  is removed from the log.
     */
    removeMessage: function(messageId) {
        return Promise.reject();
    },

    /**
     * Courtesy method. Used by the Context subsystem to determine if an incoming `Envelope` message
     * should mention the bot considering it's state.
     * @param  {Envelope}   envelope    Envelope instance to be analised.
     * @return {Boolean}                Whether to exepect this incoming message to mention the bot.
     */
    messageShouldBeUsedInContext: function(envelope) {
        return true;
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
    searchChannel: function(nameOrId) {
        return new Promise((resolve, reject) => {
            this.db.Channel.findOne({ $or: [{ name: nameOrId }, { id: nameOrId }] })
            .then((c) => {
                if(c) {
                    resolve(c);
                } else {
                    reject(new Error('Channel not found.'));
                }
            })
            .catch(reject);
        });
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
    searchUser: function(nameOrId) {
        return new Promise((resolve, reject) => {
            this.db.User.findOne({ $or: [{ username: nameOrId }, { id: nameOrId }] })
            .then((u) => {
                if(u) {
                    resolve(u);
                } else {
                    reject(new Error('User not found.'));
                }
            })
            .catch(reject);
        });
    },

    /**
     * Sends a notification to the adapter source indicating that the bot is typing something.
     * @param {Response}   envelope         The object being responded by the bot. Used to identify
     *                                      the target channel.
     * @return {undefined}                    Nothing.
     */
    sendTypingState: function(envelope) { }
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
