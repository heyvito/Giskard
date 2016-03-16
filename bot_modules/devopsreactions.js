// $ DevOpsReactions
// $ Authors: John
// $ Created on: Tue Mar 15 13:20:23 UTC 2016

var Base = require('../src/base_module'),
    cheerio = require('cheerio');

var DevOpsReactions = function(bot) {
    Base.call(this, bot);

    this.respond(/devops\s?reactions$/i, (response) => {
        this.http({
                uri: `http://devopsreactions.tumblr.com/random`,
                transform: (body) => cheerio.load(body)
            })
            .then(($) => {
                var title = $('.post_title a').text(),
                    image = $('.item_content p img').attr('src');
                if (title && image) {
                    response.send([title, image].join('\n'));
                }
            })
    });
};

Base.setup(DevOpsReactions);
module.exports = DevOpsReactions;
