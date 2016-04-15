// $ Dashbot
// $ Authors: john
// $ Created on: Tue Apr 12 17:09:46 BRT 2016
// - Postar: posta no dashbot o titulo <titulo>, com a descricao <descricao>, com a duracao <numero de dias>, e a imagem <url>
// - Listar: listar todos os posts do dashbot
// - deletar: deleta o post <titulo> do dashbot
// - Imagehost: usar o imgsafe.org

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

    this.respond(/listar todos os posts do dashbot$/i, (response) => {
        var posts = '';
        Posts.find({
            "due": {
                $gte: new Date()
            }
        }, (err, result) => {
            if (result.length > 0) {
                result.forEach((item) => {
                    posts = posts + 'Titulo:' + item.title + '\n';
                    response.reply('Tenho estes posts:\n```' + posts + '```');
                })
            } else {
                response.reply('Não tem nenhum post cadastrado no dashbot!');
            }

        });
    });

    this.respond(/deleta o post (.*) do dashbot$/i, (response) => {
        var post = response.match[1];
        response.user.ask('Tem certeza que deseja deletar o `' + post + '` ?', 2)
            .then((result) => {
                if (result.match) {
                    Posts.findOneAndRemove({
                        "title": post
                    }, (err) => {
                        if (err) {
                            response.reply('Não achei este post :fearful:');
                        } else {
                            response.reply('Post removido com sucesso! :ok_hand:');
                        }
                    });
                } else {
                    response.reply('Tudo bem, vou manter ele ativo :parrot:');
                }
            })
    });

};

Base.setup(Dashbot, 'Dashbot');
module.exports = Dashbot;
