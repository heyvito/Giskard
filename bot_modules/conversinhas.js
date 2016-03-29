// $ Conversinhas
// $ Authors: Capote, Junior
// $ Created on: Tue Mar 29 11:45:54 BRT 2016
// - Manda um gif <categoria> pra/o <usuário>: Pesquisa por gifs contendo a categoria especificada
// e a envia para um determinado usuário.

var Base = require('../src/base_module');

var Conversinhas = function(bot) {
    Base.call(this, bot);
    this.respond(/(?:manda|envie)(?:\sum) gif (.*) (?:pr(?:a|o)) ([a-z0-9-_]+)$/i, (response) => {
        var user = response.match[2];
        var term = response.match[1];

        this.searchUser(user)
            .then(u => {
                this.http({
                    uri: 'http://api.gifme.io/v1/search',
                    qs: {
                        sfw: 'true',
                        key: 'rX7kbMzkGu7WJwvG',
                        query: term
                    },
                    json: true
                })
                .then(d => {
                    if(d.status !== 200) {
                        response.reply('Não consegui pesquisar o termo. Talvez a internet esteja quebrada. :stuck_out_tongue:');
                    } else {
                        if(!d.data.length) {
                            response.reply('Não conheço essa reação... Tente em inglês! :bitchface:');
                        } else {
                            var link = this.random(d.data.filter(i => !i.nsfw)).link;
                            u.send(`_Alguém_ pediu pra te mandar esse gif aqui:\n${link}`);

                            response.reply(`Pó deixar! :wink:`);
                        }
                    }
                });
            })
            .catch(() => {
                response.reply(`Quenhé ${user}? Escreve direito ae`);
            });
    });
};

Base.setup(Conversinhas, 'Conversinhas');
module.exports = Conversinhas;
