var mongoose = require('mongoose');

var userAssocSchema = mongoose.Schema({
    userId: String,
    name: String,
    value: String
});

/**
 * Returns the UserAssoc descrption. Useful during debug.
 * @return {String}     UserAssoc description.
 * @instance
 * @name  toString
 * @memberOf UserAssoc
 * @method
 */
userAssocSchema.methods.toString = function() {
    return `[Giskard::Models::UserAssoc <[User ${this.userId}] ${this.name}: ${this.value}>]`;
}

/**
 * Represents a stored User association metadata.
 * @constructor
 * @name  UserAssoc
 */
module.exports = mongoose.model('UserAssoc', userAssocSchema);
