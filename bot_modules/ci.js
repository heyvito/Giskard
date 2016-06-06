// $ CI
// $ Authors: victorgama
// $ Created on: Sun Jun  5 18:39:19 BRT 2016
// - Liste os últimos builds: Mostra informações sobre o último build dos 5 últimos repositórios
// atualizados no CI
// - Build usuário/repo: Reinicia o último build do repositório "repo" do usuário "user"
// - Build repo: Reinicia o último build do repositório "repo" do usuário padrão configurado, se
// configurado

var Base = require('../src/base_module'),
    Drone = require('drone-node');

var CI = function(bot) {
    Base.call(this, bot);
    var isConfigured = function() {
        return !!process.env.CI_HOST && !!process.env.CI_TOKEN;
    }

    var colorForStatus = function(s) {
        switch(s) {
            case 'success':
                return '#36a64f';
            case 'failed':
                return '#cc000';
            case 'running':
            case 'pending':
                return '#dbd800';
        }
    };

    var nameForStatus = function(s) {
        switch(s) {
            case 'success':
                return 'foi concluído sem erros';
            case 'failed':
                return 'falhou';
            case 'running':
                return 'ainda está em execução';
            case 'pending':
                return 'está pendente na fila';
        }
    };

    var ensureConfig = function(response) {
        return new Promise((resolve, reject) => {
            if(isConfigured()) {
                response.drone = new Drone.Client({ url: process.env.CI_HOST, token: process.env.CI_TOKEN });
                resolve(response);
            } else {
                response.reply('Alguém esqueceu de ajustar a rebimboca da parafuseta e eu não posso acessar o CI. Contate o setor de TI da sua empresa.');
                reject();
            }
        });
    };

    var enqueueBuild = (response, owner, name) => {
        response.drone.getLastBuild(owner, name)
            .then(r => {
                if(r.status === 'running') {
                    response.reply(`Hey! Esse repositório está sendo processado agorinha mesmo! :running:`);
                } else if(r.status === 'pending') {
                    response.reply('Hey! Esse respositório está na fila de builds. :clock1:');
                } else {
                    response.drone.restartBuild(owner, name, r.number)
                        .then(() => {
                            response.reply('Ok... Build na fila. Hammer time! :hammer:')
                        })
                        .catch((ex) => {
                            response.reply('Vish. Deu ruim. Contate o setor de TI. (Ou não...)');
                            this.logger.error(ex);
                        });
                }
            })
            .catch(ex => {
                if(ex.statusCode === 404) {
                    response.reply(`Erm... Eu não conheço nenhum repositório chamado \`${name}\`, pertencendo à \`${owner}\``);
                } else {
                    response.reply([
                        'Whoa! Algo que deveria ter dado certo deu errado, e o ',
                        'errado não é certo, e o que não deu certo não pode mais ',
                        'dar certo, mas agora é tarde demais, e você provavelmente ',
                        'quer avisar alguém responsável que isso deu errado. Desculpa. ',
                        ':disappointed:'
                    ].join(''));
                    this.logger.error(ex);
                }
            });
    }

    this.respond(/(quais ((foram|s(ã|a)o) os (ú|u)ltimos builds))|(liste? (os\s)?((ú|u)ltimos\s)?)builds|list_builds|builds\.list/i, (response) => {
        response.sendTyping();
        ensureConfig(response)
            .then(response => {
                response.drone.getRepos()
                    .then(repos => Promise.all(repos.map(r => response.drone.getLastBuild(r.owner, r.name)
                            .then(b => ({
                                repo: r,
                                build: b
                            })
                    ))))
                    .then(repos => repos.sort(b => b.build.created_at).reverse())
                    .then(repos => repos.slice(0, 5))
                    .then(repos => repos.map(r => ({
                            fallback: `Build #${r.build.number} com modificações de ${r.build.author} ${nameForStatus(r.build.status)}`,
                            color: colorForStatus(r.build.status),
                            author_name: `Build #${r.build.number}`,
                            author_link: `${process.env.CI_HOST}/${r.repo.owner}/${r.repo.name}/${r.build.number}`,
                            title: r.repo.name,
                            text: `Build #${r.build.number} com modificações de ${r.build.author} ${nameForStatus(r.build.status)}`,
                            fields: [
                                {
                                    title: 'Build Link',
                                    value: `${process.env.CI_HOST}/${r.repo.owner}/${r.repo.name}/${r.build.number}`,
                                    short: false
                                },
                                { title: 'Commit', value: r.build.link_url, short: false }
                            ],
                            footer: 'Drone CI',
                            footer_icon: 'https://cloud.google.com/container-registry/images/drone_logo.svg'
                        })))
                    .then(attachment => {
                        response.reply('Aqui está:', attachment);
                    })
                    .catch(console.error);
            });
    });

    this.respond(/build\s([0-9a-z_][0-9a-z-_]*[0-9a-z_])\/(.*)$/, (response) => {
        response.sendTyping();
        ensureConfig(response)
            .then(response => {
                var owner = response.match[1],
                    name = response.match[2];
                enqueueBuild(response, owner, name);
            })
            .catch(ex => this.logger.error(ex));
    });

    this.respond(/build\s([0-9a-z-._]+)$/, (response) => {
        if(process.env.CI_DEFAULT_USER) {
            response.sendTyping();
            ensureConfig(response)
                .then(response => {
                    var name = response.match[1];
                    enqueueBuild(response, process.env.CI_DEFAULT_USER, name);
                })
                .catch(ex => this.logger.error(ex));
        } else {
            response.reply('Bummers! Eu não sei qual o usuário padrão do CI. Talvez o setor de TI possa me ajudar com isso.');
        }
    })
};

Base.setup(CI, 'CI');
module.exports = CI;
