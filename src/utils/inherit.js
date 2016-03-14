module.exports = function(sub, base) {
    var origProto = sub.prototype;
    sub.prototype = Object.create(base.prototype);
    for(var key in origProto) {
        sub.prototype[key] = origProto[key];
    }

    Object.defineProperty(sub.prototype, 'constructor', {
        enumerable: false,
        value: sub
    });
};
