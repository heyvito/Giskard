// $ Sudo
// $ Authors: victorgama
// $ Created on: Mon Mar 14 15:37:53 BRT 2016

var Base = require('../src/base_module');

var Sudo = function(bot) {
    Base.call(this, bot);
    this.respond(/sudo echo #?([a-z0-9-_]+)\s(.+)$/, (response) => {
            response.getUser().then(u => {
                if(u.isRoot()) {
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
        })
        .respond(/sudo add-sudoer ([a-z0-9-_]+)/i, (response) => {
            response.getUser().then(u => {
                if(u.isRoot()) {
                    this.searchUser(response.match[1])
                        .then(u => {
                            u.setRole('root')
                                .then(() => response.reply('Done!'))
                                .catch((ex) => response.reply(`Error: ${ex.message}`));
                        })
                        .catch((ex) => response.reply(`Error: ${ex.message}`));
                }
            });
        })
        .respond(/sudo rm-sudoer ([a-z0-9-_]+)/i, (response) => {
            response.getUser().then(u => {
                if(u.isRoot()) {
                    this.searchUser(response.match[1])
                        .then(u => {
                            u.unsetRole('root');
                            u.save().then(() => response.reply('Done!'))
                                    .catch((ex) => response.reply(`Error: ${ex.message}`));
                        })
                        .catch((ex) => response.reply(`Error: ${ex.message}`));
                }
        });
    });
};

Base.setup(Sudo);
module.exports = Sudo;
