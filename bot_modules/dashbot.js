// $ Dashbot
// $ Authors: john
// $ Created on: Tue Apr 12 17:09:46 BRT 2016
// - Test: This is a sample command description that will be parsed
// and shown to users when they request help. Make sure to document
// every command your module provides.

var Base = require('../src/base_module');

var Dashbot = function(bot) {
    Base.call(this, bot);
    var Posts = this.registerModel('Posts', {
        title: String,
        description: String,
        image: String,
        due: Date
    });
    this.exposeApi('get', '/posts', (req, res) => {
        res.set('Content-Type', 'text/html');
        Posts.find({
            "due": {
                $gte: new Date()
            }
        }, (err, result) => {
            var list = '';
            result.forEach((item) => {
                list = list + `<li style="background-image: url('${item.image}');" title="${item.title}" subtitle="${item.description}"></li>`;
            });
            res.send(`<!DOCTYPE html> <head> <title>D3 | Dashboard</title> <link rel="stylesheet" href="http://d3estudio.com.br/dashboard/assets/css/style.css" type="text/css"/> <link rel="stylesheet" href="http://d3estudio.com.br/dashboard/assets/css/jquery.bxslider.css" type="text/css"/> <script src="http://d3estudio.com.br/dashboard/assets/scripts/jquery.min.js"></script> <script src="http://d3estudio.com.br/dashboard/assets/scripts/jquery.bxslider.js"></script> </head> <body> <script type="text/javascript">$(document).ready(function(){$('.bxslider').bxSlider({pager: false, mode: 'fade', captions: true, auto: true, speed: 1000,});}); </script> <ul class="bxslider"> ${list} </ul> </body> </html>`);
        });
    })
    this.respond(/(?:posta|poste) no dashbot o t(?:í|i)tulo (.*), com a descri(?:ç|c)(?:ã|a)o (.*), com a dura(?:ç|c)(?:ã|a)o (.*), e a imagem (.*)$/i, (response) => {
        var title = response.match[1],
            description = response.match[2],
            duration = response.match[3],
            image = response.match[4].replace('<', '').replace('>', '');
        if (duration === 'infinito' || duration === 'infinita') {
            duration = 9999;
        } else {
            duration = parseInt(duration);
        }
        if (isNaN(duration) || duration == 0) {
            response.reply('Não vai ser possível publicar com a `duração` que você informou :face_with_rolling_eyes:. Me manda novamente!');
        } else {
            var due = new Date();
            due.setDate(due.getDate() + duration);
            Posts.create({
                title: title,
                description: description,
                image: image,
                due: due
            }, (err, post) => {
                if (err) {
                    response.reply('Deu algo errado, tenta de novo? :fearful:');
                } else {
                    response.reply('Maravilha, está publicado! :metal:```Título: ' + title + '\nDescrição: ' + description + '\nImagem: ' + image + '\nPublicado Até: ' + due.toISOString().slice(0, 10) + '```');
                }
            });
        }
    });
};

Base.setup(Dashbot, 'Dashbot');
module.exports = Dashbot;
