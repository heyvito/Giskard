var mongoose = require('mongoose'),
    bot = require('../bot').sharedInstance(),
    settings = require('./settings').sharedInstance();

var userSchema = mongoose.Schema({
    id: { type: String, index: { unique: true } },
    username: { type: String, index: { unique: true } },
    name: String,
    deleted: Boolean,
    lastSeen: Date,
    presence: String,
    roles: [String]
});

/**
 * Updates a user presence state to a given value.
 * @param  {String}     newP    New presence state.
 * @return {undefined}          Nothing.
 * @instance
 * @name  updatePresence
 * @memberOf User
 * @method
 */
userSchema.methods.updatePresence = function(newP) { this.presence = newP; this.save().catch(() => {}); };

/**
 * Returns the User descrption. Useful during debug.
 * @return {String}     User description.
 * @instance
 * @name  toString
 * @memberOf User
 * @method
 */
userSchema.methods.toString = function() { return `[Giskard::Models::User <${this.id || 'unknown'}>]`; };

/**
 * Sends a direct message message to the current User
 * @param  {String}     message         Message to be sent to the user.
 * @return {Promise}                    A Promise that will be either resolved or rejected when the
 *                                      message is sent or fails to be sent.
 * @instance
 * @name  send
 * @memberOf User
 * @method
 */
userSchema.methods.send = function(message) { bot.adapter.contextlessSend(this, message); };

/**
 * Checks if the current user belongs to a given role.
 * @param  {String}     role        Role name to be checked.
 * @return {Boolean}                Whether the user belongs to the given role or not.
 * @instance
 * @name  is
 * @memberOf User
 * @method
 */
userSchema.methods.is = function(role) { return this.roles.some(i => i === role); };

/**
 * Checks if the current user is a system administrator.
 * @return {Boolean}        Whether if the current user is an administrator or not.
 * @instance
 * @name  isRoot
 * @memberOf User
 * @method
 */
userSchema.methods.isRoot = function() {
    return this.is('root') || settings.roots.indexOf(this.username) > -1;
};

/**
 * Gets the mention tag for this user.
 * @return {String}   The mention tag for this user.
 * @instance
 * @name  getMentionTag
 * @memberOf User
 * @method
 */
userSchema.methods.getMentionTag = function() { return bot.adapter.getMentionTagForUser(this); };

/**
 * Returns whether this user is online or not.
 * @return {Boolean}        Whether this user is online or not.
 * @instance
 * @name  isOnline
 * @memberOf User
 * @method
 */
userSchema.methods.isOnline = function() { return this.presence !== 'away'; };

/**
 * Updates the last seen value for this user.
 * @return {Promise}        A promise that will be resolved after the user is updated.
 * @instance
 * @name  updateLastSeen
 * @memberOf User
 * @method
 */
userSchema.methods.updateLastSeen = function() {
    this.lastSeen = Date.now();
    return this.save();
};

/**
 * Sends a prompt to the current user.
 * @param  {String} message Prompt to be sent to the user.
 * @param  {Number} type    Type of expected answer. Possible values are Context.NUMBER,
 *                          Context.BOOL, and Context.REGEX. Documentation about those items and
 *                          how they behave can be found in the `Context` documentation.
 * @return {Promise}        A Promise that will be resolved whenever the target user replies to
 *                          the prompt in the given Channel. This promise cannot be rejected,
 *                          but it may never be resolved.
 * @instance
 * @name  ask
 * @memberOf User
 * @method
 */
userSchema.ask = function(message, type) {
    var args = [message, this.id, bot.adapter.dmForUser(this.id), type];
    return bot.contextManager.pushContext.apply(bot.contextManager, args);
};

/**
 * Sets the current user in a given role.
 * @param {String}  role    Role name.
 * @return {Promise}        A Promise that will be resolved after the user is successfully updated.
 * @instance
 * @name  setRole
 * @memberOf User
 * @method
 */
userSchema.methods.setRole = function(role) {
    role = role.toLowerCase();
    if(this.roles.indexOf(role) > -1) {
        return Promise.resolve(this);
    } else {
        this.roles.push(role);
        return this.save();
    }
};

/**
 * Removes the current user in a given role.
 * @param {String}  role    Role name.
 * @return {Promise}        A Promise that will be resolved after the user is successfully updated.
 * @instance
 * @name  usetRole
 * @memberOf User
 * @method
 */
userSchema.methods.unsetRole = function(role) {
    var normalisedRole = role.toLowerCase();
    if(!this.roles.some(i => i.toLowerCase() === normalisedRole)) {
        return Promise.resolve(this);
    } else {
        this.roles.splice(this.roles.map(i => i.toLowerCase()).indexOf(normalisedRole), 1);
        return this.save();
    }
}

/**
 * Creates or updates a user based on incoming Slack payload
 * @param  {AnyObject} objData Slack payload to be used to create or update the user.
 * @return {Promise}            A Promise that will be resolved after the user has been created or
 *                              updated.
 * @static
 * @name  fromSlackData
 * @memberOf User
 * @method
 */
userSchema.statics.fromSlackData = function(objData) {

    // jscs:disable
    var uData = {
        id: objData.id,
        username: objData.name,
        name: objData.profile.real_name,
        deleted: objData.deleted,
        presence: objData.presence
    };

    // jscs:enable
    return this
        .findOneAndUpdate({ id: objData.id }, uData, { new: true, upsert: true })
        .then((u) => {
            if(objData.presence !== 'away') {
                return u.updateLastSeen();
            } else {
                return u;
            }
        });
};

/**
 * Represents a stored User.
 * @constructor
 * @name  User
 */
module.exports = mongoose.model('User', userSchema);
