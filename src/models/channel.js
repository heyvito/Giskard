var mongoose = require('mongoose'),
    bot = require('../bot').sharedInstance();

var channelSchema = mongoose.Schema({
    id: { type: String, index: { unique: true } },
    name: { type: String, index: { unique: true } },
    deleted: Boolean,
    partOf: Boolean
});

channelSchema.methods.toString = function() { return `[Giskard::Models::Channel <${this.id}>]`; };
channelSchema.methods.send = function(message) { bot.adapter.contextlessSend(this, message); };
channelSchema.statics.fromSlackData = function(objData) {
    var cData = {
        id: objData.id,
        name: objData.name,
        deleted: objData.is_archived,
        partOf: objData.is_member
    };
    return this.findOneAndUpdate({ id: cData.id }, cData, { new: true, upsert: true });
};

module.exports = mongoose.model('Channel', channelSchema);
