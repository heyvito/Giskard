module.exports = function(classType) {
    var _instance = null;
    return {
        sharedInstance: function() {
            return _instance || (_instance = new classType());
        }
    }
};
