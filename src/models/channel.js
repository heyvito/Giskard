var mongoose = require('mongoose'),
    bot = require('../bot').sharedInstance();

var channelSchema = mongoose.Schema({
    id: { type: String, index: { unique: true } },
    name: { type: String, index: { unique: true } },
    deleted: Boolean,
    partOf: Boolean
});

/**
 * Returns the Channel descrption. Useful during debug.
 * @return {String}     Channel description.
 * @memberOf Channel
 * @method toString
 * @instance
 */
channelSchema.methods.toString = function() { return `[Giskard::Models::Channel <${this.id}>]`; };

/**
 * Sends a message to the current Channel
 * @param  {String}     message         Message to be sent to the channel.
 * @param  {Array}      [attachments]   An array of attachments to be sent with the message.
 * @return {Promise}                    A Promise that will be either resolved or rejected when the
 *                                      message is sent or fails to be sent.
 * @instance
 * @name  send
 * @memberOf Channel
 * @method
 */
channelSchema.methods.send = function(message, attachments) { return bot.adapter.contextlessSend(this, message, attachments); };

/**
 * Creates or updates a Channel on the database based on received Slack data.
 * @param  {AnyObject}  objData     Received Channel descriptor from Slack
 * @return {Promise}                A Promise that will be resolved or rejected when the channel
 *                                  has been created or updated.
 * @memberOf Channel
 * @method fromSlackData
 * @static
 */
channelSchema.statics.fromSlackData = function(objData) {

    // jscs:disable
    var cData = {
        id: objData.id,
        name: objData.name,
        deleted: objData.is_archived,
        partOf: objData.is_member
    };

    // jscs:enable
    return this.findOneAndUpdate({ id: cData.id }, cData, { new: true, upsert: true });
};

/**
 * Represents a Channel stored in the database.
 * @name Channel
 * @constructor
 */
module.exports = mongoose.model('Channel', channelSchema);
