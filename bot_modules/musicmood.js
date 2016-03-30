// $ Musicmood
// $ Authors: John
// $ Created on: Wed Mar 30 03:16:24 UTC 2016
// - musicmood artist - song: Send a mood and a color based on Musicmood
// - musicmood playlist mood: Send a playlist with the sent mood
// - musicmood list: list all the available moods

var Base = require('../src/base_module');

var Musicmood = function(bot) {
    Base.call(this, bot);

    this.hear(/musicmood list$/i, (response) => {
        response.sendTyping();
        this.http({
                uri: "http://api.musicmood.me/moods"
            })
            .then((moods) => {
                response.send("Enjoy this moods: `" + JSON.parse(moods).moods.map((mood) => {
                    return mood.mood
                }).join("` `") + "`");
                response.send("Ask for a playlist with: musicmood playlist `mood`");
            })
            .catch((err) => {
                response.send("I am not on the mood, sorry :(");
            })
    });

    this.hear(/musicmood playlist (.+)$/i, (response) => {
        response.sendTyping();
        this.http({
                uri: "http://api.musicmood.me/get_playlist/" + response.match[1]
            })
            .then((playlist) => {
                var url = JSON.parse(playlist).playlist_url
                if (url) {
                    response.send(url);
                } else {
                    response.send("I do not have this mood, YET :). Try another");
                }
            })
            .catch((err) => {
                response.send("I am not on the mood, sorry :(");
            })
    });

    this.rgbToHex = function(color) {
        return "#" + ((1 << 24) + (color[0] << 16) + (color[1] << 8) + color[2]).toString(16).slice(1);
    }

    this.hear(/musicmood (.+)$/i, (response) => {
        response.sendTyping();
        var query = response.match[1].split("-").map((part) => {
            return part.trim();
        });
        if (query && query.length === 2) {
            this.http({
                    uri: `http://api.musicmood.me/mood/${encodeURIComponent(query[0])}/${encodeURIComponent(query[1])}`
                })
                .then((mood) => {
                    var mood = JSON.parse(mood);
                    if (!mood.error) {
                        response.send(`Music: ${query[0]} - ${query[1]}`);
                        response.send("Mood : `" + mood.mood + "`");
                        response.send("Color: `" + this.rgbToHex(mood.color) + "`");
                    } else {
                        response.send("Did not found this song, sorry :(");
                    }
                })
                .catch((err) => {
                    response.send("I am not on the mood, sorry :(");
                })
        } else {
            response.send("Please, send as `Artist - Song` and i will do my magic!");
        }
    });
};

Base.setup(Musicmood, 'Musicmood');
module.exports = Musicmood;
