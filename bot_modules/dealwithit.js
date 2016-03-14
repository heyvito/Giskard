// $ DealWithIt
// $ Authors: victorgama
// $ Created on: Mon Mar 14 15:23:26 BRT 2016
// - Deal With It: Escuta em todos os canais por uma mensagem que contenha
// deal with it e responde com um gif

var Base = require('../src/base_module');

var DealWithIt = function(bot) {
    Base.call(this, bot);
    this.images = [
        'http://i.imgur.com/ykDuU.gif',
        'http://i.imgur.com/3PWHn.gif',
        'http://i.imgur.com/sEinL.gif',
        'http://i.imgur.com/zsK7e.gif',
        'http://i.imgur.com/rE2aH.gif',
        'http://i.imgur.com/Wj3Do.gif',
        'http://i.imgur.com/SvdS0.gif',
        'http://i.imgur.com/bh6xc.gif',
        'http://i.imgur.com/aoaqO.gif',
        'http://i.imgur.com/oe01J.gif',
        'http://i.imgur.com/N5N4x.gif',
        'http://i.imgur.com/Z3KIP.gif',
        'http://i.imgur.com/oFo42.gif',
        'http://i.imgur.com/rbBAaRs.gif',
        'http://i.imgur.com/JDRZ21o.gif',
        'http://i.imgur.com/WhiQ67r.gif',
        'http://i.imgur.com/KLLX1xx.png',
        'http://i.imgur.com/BjtEpbY.gif',
        'http://i.imgur.com/Z3DJlxS.gif',
        'http://i.imgur.com/qjTTrcB.gif',
        'http://i.imgur.com/HHyy9RL.gif',
        'http://i.imgur.com/PilYVTI.gif',
        'http://i.imgur.com/i6xvVSN.gif',
        'http://i.imgur.com/5mnJ0je.gif',
        'http://i.imgur.com/myOz11I.gif',
        'http://i.imgur.com/VyKt1xD.gif',
        'http://i.imgur.com/tBGAWgf.gif',
        'http://i.imgur.com/2MTQrQf.gif',
        'http://i.imgur.com/CxhomG0.gif',
        'http://i.imgur.com/vA2UnyC.gif',
        'http://i.imgur.com/5pMiY03.gif'
    ];
    this.hear(/deal with it/i, (response) => {
        response.send(this.random(this.images));
    });
};

Base.setup(DealWithIt);
module.exports = DealWithIt;
