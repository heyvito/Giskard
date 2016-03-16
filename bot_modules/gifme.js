// $ GifMe
// $ Authors: victorgama
// $ Created on: Mon Mar 14 15:29:14 BRT 2016
// - Gif( me) <categoria>: Pesquisa por gifs contendo a categoria especificada
// no giphy.com e retorna um resultado aleatório.

var Base = require('../src/base_module');

var GifMe = function(bot) {
    Base.call(this, bot);
    this.respond(/gif( me)? ([\w\??| ]+)$/i, (response) => {
        response.sendTyping();
        var tag = response.match[2];
        this.http({
                uri: 'http://api.gifme.io/v1/search',
                qs: {
                    sfw: 'true',
                    key: 'rX7kbMzkGu7WJwvG',
                    query: tag
                },
                json: true
            })
            .then(d => {
                if(d.status !== 200) {
                    response.reply('Não consegui pesquisar o termo. Talvez a internet esteja quebrada. :stuck_out_tongue:');
                } else {
                    if(!d.data.length) {
                        response.reply('Não conheço essa reação... :disappointed:');
                    } else {
                        response.reply(this.random(d.data.filter(i => !i.nsfw)).link);
                    }
                }
            });
    });
};

Base.setup(GifMe);
module.exports = GifMe;
