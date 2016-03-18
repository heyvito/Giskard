var crypto = require('crypto');

var Socket = function(parent, s) {
    this.s = s;
    this.adapter = parent;
    this.username = this.name = '';
    this.id = '';
    this.channel = parent.channelName;
    this.ready = false;

    this.s
        .on('message', (msg) => {
            if(this.ready) {
                this.adapter.receive(this.adapter.makeEnvelope(msg.text, msg, this, this.channel));
                this.adapter.io.emit('user_said', msg);
            }
        })
        .on('identify', (msg) => {
            this.username = msg.username;
            this.name = msg.name;
            this.id = '__debug_user' + crypto.createHash('md5').update(this.username).digest('hex');
            this.adapter.db.User.fromSlackData({
                id: this.id,
                username: this.username,
                profile: {
                    real_name: this.name
                },
                deleted: false,
                presence: 'active',
            }).then(u => {
                this.dbModel = u;
                this.ready = true;
                this.s.emit('ready', { id: this.id });
                this.adapter.io.emit('user_connected', {
                    username: this.username,
                    name: this.name,
                    id: this.id
                });
            });
        });
}

module.exports = Socket;
