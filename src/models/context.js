var mongoose = require('mongoose'),
    User = require('./user'),
    logger = require('../utils/logger')('ContextModel');

var contextSchema = mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    uid: String,
    cid: String,
    ts: String
});

contextSchema.methods.getUser = function() {
    if(!this.id) {
        return Promise.reject('Cannot perform getUser on an unsaved Context object.');
    } else {
        return User.findOne({ id: this.uid });
    }
};

contextSchema.statics.createWithMessage = function(message, user, channel) {
    return this.create({
        uid: typeof user === 'string' ? user : user.id,
        cid: message.channel,
        ts: message.ts
    });
};

var model = mongoose.model('Context', contextSchema);

model.NUMBER = 1;
model.BOOLEAN = 2;
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
    var positive = /^(y.*|sim|uhum|s|aff?irmativ(e|o)|positiv(e|o)|1|thumbs_?up|ok_?hand)$/i,
        negative = /^(no.*|nah|n(ã|a)o|negativ(e|o)|0|thumbs_?down|(n|ñ))$/i;
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
