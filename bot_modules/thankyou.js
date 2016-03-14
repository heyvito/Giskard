// $ ThankYou
// $ Authors: John
// $ Created on: Mon Mar 14 19:19:45 UTC 2016

var Base = require('../src/base_module');

var ThankYou = function(bot) {
    Base.call(this, bot);

    this.answers = [
        'Por nada!',
        'De nada!',
        'Magina!',
        'Sem problemas!',
        ':wink:',
        ':sunglasses:'
    ];
    this.respond(/(obrigad(o|a)|valeu|vlw)!?$/i, (response) => {
            response.reply(this.random(this.answers));
        })
        .hear(/(obrigad(?:o|a)|valeu|vlw)\s(.*)!?/i, (response) => {
            if (this.mentionsBot(response.match[2])) {
                response.reply(this.random(this.answers));
            }
        });
};

Base.setup(ThankYou);
module.exports = ThankYou;
