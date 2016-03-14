// $ Basic
// $ Authors: Victor Gama
// $ Created on: Sun Mar 15 14:26:45 BRT 2015
// - Quais são as três leis: Lista as leis da robótica

var Base = require('../src/base_module');

var Basic = function() {
    Base.call(this);
    this
        .respond(/(oi|ol(á|a))(\?|!|\.)*$/i, (response) => {
            response.reply('Oi!');
        })
        .respond(/(me )?(ajud(a|e))$/i, (response) => {
            response.reply('Claro! Eis uma lista do que eu sei fazer:\n\n' + this.bot.moduleManager.help
                .map((h) => `> ${h}`)
                .join('\n'));
        })
        .respond(/hallo!/, (response) => {
            response.ask('Sprechen Sie Deutsch?', this.Context.BOOLEAN)
                .then((response) => {
                    if(response.match) {
                        response.reply('Gut!');
                    } else {
                        response.reply('I though so...');
                    }
                })
                .catch(ex => console.error(ex));
        })
        .respond(/ask me a number/, (response) => {
            response.ask('Well, gimme a number!', this.Context.NUMBER)
                .then((response) => {
                    response.reply('You gave me ' + response.match);
                });
        });
}

Base.setup(Basic);

module.exports = Basic;
