// $ Xkcd
// $ Authors: John
// $ Created on: Mon Mar 14 19:28:04 UTC 2016
// - xkcd( me): Exibe uma tirinha de xkcd.com

var Base = require('../src/base_module'),
    cheerio = require('cheerio');

var Xkcd = function(bot) {
    Base.call(this, bot);

    this.respond(/xkcd(?: me)? ([\d]+)$/i, (response) => {
        this.http({
                uri: `http://xkcd.com/${response.match[1]}`,
                transform: (body) => cheerio.load(body)
            })
            .then(($) => {
                var title = $('div#ctitle').text();
                var explanation = $('div#comic img').attr('title');
                var src = $('div#comic img').attr('src');
                if (src) {
                    response.send(`*${title}*\n http:${src}\n`);
                    response.send(`> ${explanation}`);
                } else {
                    response.reply('Deu ruim, não achei essa tirinha');
                }
            })
    });
};

Base.setup(Xkcd);
module.exports = Xkcd;
