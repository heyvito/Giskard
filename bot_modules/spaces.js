// $ Spaces
// $ Authors: victorgama
// $ Created on: Wed Mar 16 18:20:27 BRT 2016
// - me coloca de spaces <quando>: Te coloca de spaces no periodo informado (o dia todo, hoje, pela manha, a tarde)

var Base = require('../src/base_module');

var Spaces = function(bot) {
    Base.call(this, bot)
    this.respond(/me coloca de spaces (.+)$/i, (response) => {
        response.sendTyping();
        var randomPhrases = {
                day: [
                    'ficou vendo filme até tarde ontem e vai ficar de spaces o dia todo!',
                    'gastou todo o bilhete único e vai ficar de spaces até amanhã (ou até recarregar)!',
                    'achou que hoje era domingo e ainda não saiu da cama, vai de spaces o dia todo!',
                    'precisa fazer umas paradas e precisa de silêmcio, fica de spaces hoje!',
                    'teve que ir ajudar a ONU, mas amanhã esta de volta, spaces internacional hoje!'
                ],
                morning: [
                    'marcou um café comigo e esta de spaces agora cedo!',
                    'pegou um uber que não sabe usar o Waze mas vem trabalhar depois do almocço!',
                    'não sabe onde deixou as chaves, spaces até o almoço (ou até achar as chaves)!',
                    'veio pra Starbucks comigo e vai de spaces agora cedo!',
                    'esta coisando umas coisas e fica de spaces até o almoço!'
                ],
                afternoon: [
                    'veio pra D3 mas esqueceu de alimentar os pombos. Vai de spaces agora à tarde!',
                    'vai atender a Judith da TIM, spaces depois do almoço!',
                    'teve um incidente com a feijoada do Mineiro, vai pra casa mas esta na ativa agora à tarde.',
                    'vai comigo até o shopping, depois direto pra casa. Vamos estar de spaces!',
                    'não aguenta mais as britadeiras, vai pra paz e silêncio do cafofo. Spaces pós almoço.'
                ]
            },
            phrase,
            defaultPhrase = 'Preciso saber quando. Você pode mandar: `o dia todo`, `pela manhã`, `à tarde` ou `hoje` :ok_hand:',
            when = response.match[1];
        if (when == "o dia todo" || when == "hoje") {
            phrase = randomPhrases.day[Math.floor(Math.random() * randomPhrases.day.length)];
        } else if (when == "pela manha" || when == "pela manhã") {
            phrase = randomPhrases.morning[Math.floor(Math.random() * randomPhrases.day.length)];
        } else if (when == "a tarde" || when == "à tarde") {
            phrase = randomPhrases.afternoon[Math.floor(Math.random() * randomPhrases.day.length)];
        } else {
            phrase = defaultPhrase;
        }
        if (phrase !== defaultPhrase) {
            response.getUser().then(u => {
                this.searchChannel('general')
                    .then((c) => {
                        c.send(`Galera, ${this.getMentionTagForUser(u)} ${phrase} :rocket:`);
                        response.reply('Pronto! :rocket:');
                    })
                    .catch((ex) => {
                        this.searchUser('joaomarcus')
                            .then((u) => {
                                response.reply(`Não consegui te colocar de spaces, o ${this.getMentionTagForUser(u)} não deixou. :neutral_face:`);
                            })
                    });
            });
        } else {
            response.reply(defaultPhrase);
        }

    });
    this.hear(/spaces/i, function(response) {
        if (['general', 'r2d3-tests'].indexOf(response.channel.name) > -1 && Math.random() < 0.2) {
            response.addReaction('rocket');
        }
    });
};

Base.setup(Spaces, 'Spaces');
module.exports = Spaces;
