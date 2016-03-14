// $ Debug
// $ Authors: victorgama
// $ Created on: Sun Mar 15 15:03:33 BRT 2015

var Base = require('../src/base_module');

var Debug = function(bot) {
    Base.call(this, bot);
    this
        .respond(/debug\: list modules$/i, (response) => {
            response.reply(Object.keys(this.bot.moduleManager.modulesInfo)
                .map(k => this.bot.moduleManager.modulesInfo[k].header)
                .map(d => {
                    var text = `*${d.name}*\n> *Created on* \`${d.created}\`\n> *By* `,
                        authors = d.authors.slice(),
                        lastAuthor = authors.splice(authors.length - 1);
                    text += (authors.length > 0 ? authors.join(', ') + ' and ' : '') + lastAuthor + '\n\n';
                    return text;
                }).join(''));
        })
        .respond(/debug\: list settings$/i, (response) => {
            response.reply(['```', JSON.stringify(this.bot.settings, null, 4), '```'].join('\n'));
        });
};

Base.setup(Debug);
module.exports = Debug;
