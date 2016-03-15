// $ HackerNews
// $ Authors: vagrant
// $ Created on: Tue Mar 15 13:05:51 UTC 2016
// - Test: This is a sample command description that will be parsed
// and shown to users when they request help. Make sure to document
// every command your module provides.

var Base = require('../src/base_module'),
    cheerio = require('cheerio');

var HackerNews = function(bot) {
    Base.call(this, bot);

    this.respond(/hacker\s?news$/i, (response) => {
        this.http({
                uri: `http://news.ycombinator.com`,
                transform: (body) => cheerio.load(body)
            })
            .then(($) => {
                var result = [];
                $('td.title > a').slice(0, 3).each(function() {
                    var a = $(this);
                    result.push([a.text(), a.attr('href')].join('\n'));
                });
                response.send(result.join('\n\n'));
            })
    });
};

Base.setup(HackerNews);
module.exports = HackerNews;
