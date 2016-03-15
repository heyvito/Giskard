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
 */
channelSchema.methods.toString = function() { return `[Giskard::Models::Channel <${this.id}>]`; };

/**
 * Sends an message to the current Channel
 * @param  {String}         Message to be sent to the channel.
 * @return {Promise}        A Promise that will be either resolved or rejected when the message is
 *                          sent or fails to be sent.
 */
channelSchema.methods.send = function(message) { return bot.adapter.contextlessSend(this, message); };

/**
 * Creates or updates a Channel on the database based on received Slack data.
 * @param  {AnyObject}  objData     Received Channel descriptor from Slack
 * @return {Promise}                A Promise that will be resolved or rejected when the channel
 *                                  has been created or updated.
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

module.exports = mongoose.model('Channel', channelSchema);
