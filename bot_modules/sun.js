// $ Sun
// $ Authors: John
// $ Created on: Mon Mar 14 19:24:59 UTC 2016

var Base = require('../src/base_module');

var Sun = function(bot) {
    Base.call(this, bot);

    this.hear(/:(sun_with_face|sunny):/i, (response) => {
        response.reply('http://i.imgur.com/aWEX2UC.gif');
    });
};

Base.setup(Sun);
module.exports = Sun;
