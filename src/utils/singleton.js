module.exports = function(ClassType) {
    var _instance = null;
    return {
        sharedInstance: function() {
            return _instance || (_instance = new ClassType());
        }
    };
};
