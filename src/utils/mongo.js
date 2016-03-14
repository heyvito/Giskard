var settings = require('../models/settings').sharedInstance(),
    mongo = require('mongodb').MongoClient;

var instance,
    getCollection = function(name) {
        if (instance) {
            return instance.collection(name);
        } else {
            return new Promise((resolve, reject) => {
                MongoClient.connect(settings.mongoUrl, (err, db) => {
                    if (err) {
                        reject(err);
                    } else {
                        instance = db;
                        getCollection(name).then(resolve).catch(reject);
                    }
                });
            });
        }
    };

module.exports = {
    getCollection: getCollection
};
