var mongoose = require('mongoose'),
    bot = require('../bot').sharedInstance();

var userSchema = mongoose.Schema({
    id: { type: String, index: { unique: true } },
    username: { type: String, index: { unique: true } },
    name: String,
    deleted: Boolean,
    lastSeen: Date,
    presence: String,
    roles: [String],
});

userSchema.methods.updatePresence = function(newP) { this.presence = newP; this.save().catch(() => {}); };
userSchema.methods.toString = function() { return `[Giskard::Models::User <${this.id || 'unknown'}>]`; };
userSchema.methods.send = function(message) { bot.adapter.contextlessSend(this, message); };
userSchema.methods.is = function(role) { return this.roles.some(i => i === role); };
userSchema.methods.isRoot = function() { return this.is('root'); };
userSchema.methods.getMentionTag = function() { return bot.adapter.getMentionTagForUser(this); };
userSchema.methods.isOnline = function() { this.presence !== 'away'; };
userSchema.methods.updateLastSeen = function() {
    this.lastSeen = Date.now();
    return this.save();
};
userSchema.ask = function() { throw new Error('Not Implemented.'); }
userSchema.methods.setRole = function(role) {
    this.roles.push(role);
    return this.save();
};

userSchema.statics.fromSlackData = function(objData) {
    var uData = {
        id: objData.id,
        username: objData.name,
        name: objData.profile.real_name,
        deleted: objData.deleted,
        presence: objData.presence
    };
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

module.exports = mongoose.model('User', userSchema);
