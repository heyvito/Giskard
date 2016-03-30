// $ Musicmood
// $ Authors: John
// $ Created on: Wed Mar 30 03:16:24 UTC 2016
// - musicmood artista - música: Responde com uma cor e um sentimento
// - musicmood playlist mood: Responde uma playlist baseada em um sentimento
// - musicmood lista: Mostra todos os meus sentimentos

var Base = require('../src/base_module');

var Musicmood = function(bot) {
    Base.call(this, bot);

    this.hear(/musicmood lista$/i, (response) => {
        response.sendTyping();
        this.http({
                uri: "http://api.musicmood.me/moods"
            })
            .then((moods) => {
                response.send("Meus sentimentos: `" + JSON.parse(moods).moods.map((mood) => {
                    return mood.mood
                }).join("` `") + "`");
                response.send("Para pedir uma playlist: musicmood playlist `mood`");
            })
            .catch((err) => {
                response.send("Não achei meus sentimentos, desculpe :(");
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
                    response.send("Não tenho esse sentimento, AINDA :). Tenta outro!");
                }
            })
            .catch((err) => {
                response.send("Não achei meus sentimentos, desculpe :(");
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
                        response.send(`Música    : ${query[0]} - ${query[1]}`);
                        response.send("Sentimento: `" + mood.mood + "`");
                        response.send("Cor       : `" + this.rgbToHex(mood.color) + "`");
                    } else {
                        response.send("Não achei essa música :(");
                    }
                })
                .catch((err) => {
                    response.send("Não achei meus sentimentos, desculpe :(");
                })
        } else {
            response.send("Por favor, envie assim: `Artista - Música` que eu faço minha mágica!");
        }
    });
};

Base.setup(Musicmood, 'Musicmood');
module.exports = Musicmood;
