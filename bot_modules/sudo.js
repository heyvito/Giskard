// $ Sudo
// $ Authors: victorgama
// $ Created on: Mon Mar 14 15:37:53 BRT 2016

var Base = require('../src/base_module');

var Sudo = function(bot) {
    Base.call(this, bot);
    this.respond(/sudo echo #?([a-z0-9-_]+)\s(.+)$/, (response) => {
            var requester = response.user;
            console.log(requester);
            if(requester && requester.isRoot()) {
                this.searchChannel(response.match[1])
                    .then((c) => {
                        c.send(response.match[2]);
                        response.reply('Done. :wink:');
                    })
                    .catch((ex) => {
                        response.reply('Failed: ' + ex.message);
                    });
            }
        });
};

Base.setup(Sudo);
module.exports = Sudo;
