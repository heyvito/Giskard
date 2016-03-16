// $ Spaces
// $ Authors: victorgama
// $ Created on: Wed Mar 16 18:20:27 BRT 2016

var Base = require('../src/base_module');

var Spaces = function(bot) {
    Base.call(this, bot);
    this.hear(/spaces/i, function(response) {
        if(['general', 'r2d3-tests'].indexOf(response.channel.name) > -1 && Math.random() < 0.2) {
            response.addReaction('rocket');
        }
    });
};

Base.setup(Spaces, 'Spaces');
module.exports = Spaces;
