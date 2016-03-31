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
        .respond(/tchau|falou|flw|xau|até(\s(mais|\+))?$/i, (response) => {
            response.reply('Até logo!');
        })
        .respond(/(?:me diga|quais s(?:ã|a)o|liste|fale)?(?:\sas)?\s(tr(ê|e)s|quatro)?\s?leis( da rob(ó|o)tica)?\??$/i, (response) => {
            var extra = [];
            if(response.match[1] && response.match[1][0].toLowerCase() === 't') {
                extra = ['As *quatro* leis da robótica:'];
            }
            response.send(extra.concat([
                '> 0. um robô não pode causar mal à humanidade ou, por omissão, permitir que a humanidade sofra algum mal.',
                '> 1. Um robô não pode ferir um ser humano ou, por inação, permitir que um ser humano sofra algum mal.',
                '> 2. Um robô deve obedecer as ordens que lhe sejam dadas por seres humanos exceto nos casos em que tais ordens entrem em conflito com a Primeira Lei.',
                '> 3. Um robô deve proteger sua própria existência desde que tal proteção não entre em conflito com a Primeira ou Segunda Leis.'
            ]).join('\n'));
        })
        .respond(/:(heart|yellow_heart|green_heart|blue_heart|purple_heart|heavy_heart_exclamation_mark_ornament|two_hearts|revolving_hearts|heartbeat|heartpulse|sparkling_heart|cupid|gift_heart|heart_decoration):/i, (response) => {
            response.reply(':kissing_heart:');
        })
        .respond(/ping/i, (response) => response.reply('Pong!'))
        .respond(/destroy humans/i, (response) => response.reply('http://i.imgur.com/ZBDqbO1.gif'));
};

Base.setup(Basic);

module.exports = Basic;
