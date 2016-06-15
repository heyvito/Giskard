var mongoose = require('mongoose');

var userNetworkAssocSchema = mongoose.Schema({
    userId: String,
    name: String,
    value: String
});

/**
 * Returns the UserNetworkAssoc descrption. Useful during debug.
 * @return {String}     userNetworkAssocSchema description.
 * @instance
 * @name  toString
 * @memberOf UserNetworkAssoc
 * @method
 */
userNetworkAssocSchema.methods.toString = function() {
    return `[Giskard::Models::userNetworkAssocSchema <[User ${this.userId}] ${this.name}: ${this.value}>]`;
}

/**
 * Represents a stored User association metadata.
 * @constructor
 * @name  UserNetworkAssoc
 */
module.exports = mongoose.model('UserNetworkAssocSchema', userNetworkAssocSchema);
