// $ Duplicate
// $ Authors: John
// $ Created on: Sat Apr  2 01:21:11 UTC 2016
// - Recurrent link: Eu verifico se existem links repetidos!

var Base = require('../src/base_module');

var Duplicate = function(bot) {
    Base.call(this, bot);
    var Links = this.registerModel('Links', {
        link: String,
        username: String,
        channel: String
    });
    this.hear(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, (response) => {
        var link = response.match[1];
        var username = response.user.username;
        var channel = response.channel.name;
        var search = Links.findOne({
            link: link
        }, (err, result) => {
            if (!err) {
                if (result) {
                    console.log('found', result);
                    if (username === result.username && channel !== result.channel) {
                        response.reply(`Você já postou este link no #${result.channel}`);
                    } else if (username === result.username && channel === result.channel) {
                        response.reply(`Você já postou este link aqui!`);
                    } else {
                        response.reply(`Ei! @${result.username} ja postou este link no #${result.channel}!`);
                    }
                } else {
                    Links.create({
                        link: link,
                        username: username,
                        channel: channel
                    });
                }
            }
        });
    });
};

Base.setup(Duplicate, 'Duplicate');
module.exports = Duplicate;
