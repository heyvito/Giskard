var mongoose = require('mongoose'),
    User = require('./user'),
    logger = require('../utils/logger')('ContextModel');

var contextSchema = mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    uid: String,
    cid: String,
    ts: String
});

/**
 * Gets the user associated to this context
 * @return {Promise}        A Promise that will be resolved when the user associated to this Context
 *                          is found. If the context has not yet been saved, the promise is
 *                          automatically rejected.
 * @instance
 * @name  getUser
 * @memberOf Context
 * @method
 */
contextSchema.methods.getUser = function() {
    if(!this.id) {
        return Promise.reject('Cannot perform getUser on an unsaved Context object.');
    } else {
        return User.findOne({ id: this.uid });
    }
};

/**
 * Courtesy method. Creates a new Context from a given {Message}, {User} and {Channel}.
 * @param  {Message}    message Message that will have its context used in the new Context.
 * @param  {User}       user    User to whom the Context belongs to.
 * @param  {Channel}    channel Channel to where the Context belongs to.
 * @return {Promise}            A Promise that will be resolved when the Context is created.
 * @static
 * @name  createWithMessage
 * @memberOf Context
 * @method
 */
contextSchema.statics.createWithMessage = function(message, user, channel) {
    return this.create({
        uid: typeof user === 'string' ? user : user.id,
        cid: message.channel,
        ts: message.ts
    });
};

/**
 * Represents a stored Context.
 * @constructor
 * @name  Context
 */
var model = mongoose.model('Context', contextSchema);

/**
 * Expects an answer that can be successfully converted into a number. Only integers are returned.
 * @type {Number}
 * @field
 * @readOnly
 * @name  NUMBER
 * @memberOf Context
 * @static
 */
model.NUMBER = 1;

/**
 * Expects an answer that matches a positive or negative regex.
 * @type {Number}
 * @field
 * @readOnly
 * @name  BOOLEAN
 * @memberOf Context
 * @static
 */
model.BOOLEAN = 2;

/**
 * Expects an answer that matches a third argument that is a custom Regex object
 * @type {Number}
 * @field
 * @readOnly
 * @name  REGEX
 * @memberOf Context
 * @static
 */
model.REGEX = 3;

var numberComparator = function(value) {
    if(typeof value === 'string') {
        if(/(\d+)/.test(value)) {
            return { valid: true, value: parseInt(value) };
        }
    } else if(typeof value === 'number') {
        return { valid: true, value: value };
    }
    return { valid: false };
};

var booleanComparator = function(value) {
    var positive = /^((y.*|sim|uhum|s|aff?irmativ(e|o)|positiv(e|o)|1|:(thumbs_?up|ok_?hand|\+1):(:[^:]+:)?)\.?)$/i,
        negative = /^((no.*|nah|n(ã|a)o|negativ(e|o)|0|:(thumbs_?down|\-1):(:[^:]+:)?|(n|ñ)))\.?$/i;
    if(positive.test(value)) {
        return { valid: true, value: true };
    } else if(negative.test(value)) {
        return { valid: true, value: false };
    } else {
        return { valid: false };
    }
};

var regexComparator = function(value, comparator) {
    if(comparator.test(value)) {
        return { valid: true, value: comparator.exec(value) };
    } else {
        return { valid: false };
    }
};

regexComparator.extra = true;

/**
 * Returns a matcher function depending on the incoming type
 * @param  {Number} type   A Context type. Possible values are NUMBER, BOOLEAN and REGEX
 * @return {Function}      A matcher function capable of parsing and returning a success state
 *                         together with the resulting value, if the parssing succeeds.
 * @instance
 * @name  createWithMessage
 * @memberOf Context
 * @method
 */
model.comparatorFor = function(type) {
    switch(type) {
        case model.NUMBER:
            return numberComparator;
        case model.BOOLEAN:
            return booleanComparator;
        case model.REGEX:
            return regexComparator;
        default:
            logger.warning('Unknown comparator of type ' + type);
            return null;
    }
};

module.exports = model;
