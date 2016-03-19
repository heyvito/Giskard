var crypto = require('crypto');

var Socket = function(parent, s) {
    this.s = s;
    this.adapter = parent;
    this.username = this.name = '';
    this.id = '';
    this.channel = parent.channelName;
    this.ready = false;

    this.s
        .on('disconnect', function(){
            if(this.dbModel) {
                this.dbModel.updatePresence('away');
            }
            if(this.id) {
                this.adapter.io.emit('user_disconnected', { id: this.id });
            }
        })
        .on('message', (msg) => {
            console.log('ready: ', this.ready);
            if(this.ready) {
                msg.user = this.dbModel;
                msg.channel = this.adapter.channelModel;
                this.adapter.io.emit('user_said', msg);
                var message = this.adapter.bot.name + ': ' + msg.text;
                this.adapter.receive(this.adapter.makeEnvelope(message, msg, this, this.channel));
            }
        })
        .on('identify', (msg) => {
            console.log(msg);
            this.username = msg.username;
            this.name = msg.name;
            this.id = '__debug_user' + crypto.createHash('md5').update(this.username).digest('hex');
            this.adapter.db.User.fromSlackData({
                id: this.id,
                name: this.username,
                profile: {
                    real_name: this.name
                },
                deleted: false,
                presence: 'active',
            }).then(u => {
                this.s.emit('ready', {
                    id: this.id,
                    userList: this.adapter.users.map(u => (u.dbModel ? {
                        username: u.username,
                        name: u.name,
                        id: this.id
                    } : null)).filter(i => i)
                });
                this.dbModel = u;
                this.ready = true;
                this.adapter.io.emit('user_connected', {
                    username: this.username,
                    name: this.name,
                    id: this.id
                });
            })
            .catch((err) => {
                console.log(err);
            })
        });
}

module.exports = Socket;
