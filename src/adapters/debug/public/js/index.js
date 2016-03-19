(function() {
    window.chat = {
        init: function() {
            this.chatLog = $('.chat-history');
            this.chatLogList = this.chatLog.find('ul');
            this.userList = $('.people-list .list');
            this.sendButton = $('button');
            this.textArea = $('#message-to-send');
            this.sendButton.on('click', this.sendMessage.bind(this));
            this.textArea.on('keyup', this.sendMessageReturn.bind(this));
            this.responseTemplateContent = $('#message-response-template').html();
            this.userMessageTemplateContent = $("#message-template").html();
            this.userConnectedTemplate = $("#user-connected-template").html();
            this.loginForm = $('#login');
            this.loginForm.submit(this.performLogin.bind(this));
            this.typingIndicator = $('#typing');
            this.socket = io();
            this.socket
                .on('ready', this.socketReady.bind(this))
                .on('delete_message', this.deleteMessage.bind(this))
                .on('bot_is_typing', this.botIsTyping.bind(this))
                .on('add_reaction_to', this.addReactionTo.bind(this))
                .on('bot_said', this.processBotMessage.bind(this))
                .on('user_said', this.appendResponse.bind(this))
                .on('user_connected', this.userConnected.bind(this))
                .on('extra_metadata', this.extraMetadata.bind(this));
        },
        performLogin: function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.socket.emit('identify', {
                name:       $('#name').val(),
                username:   $('#username').val()
            });
            return false;
        },
        sendMessageReturn: function(e) {
            if(e.keyCode === 13) {
                e.preventDefault();
                e.stopPropagation();
                this.sendMessage();
                return false;
            }
        },
        sendMessage: function() {
            var v = this.textArea.val().trim();
            if(v.length) {
                this.socket.emit('message', { text: v, ts: Date.now() });
                this.textArea.val('');
            }
        },
        scrollToBottom: function() {
            this.chatLog.scrollTop(this.chatLog[0].scrollHeight);
        },
        appendResponse: function(incomingMessage) {
            console.log('appendResponse', incomingMessage);
            var context = {
                time: new Date().toLocaleTimeString().replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3"),
                ts: incomingMessage.ts,
                response: incomingMessage.text
            };
            var template;

            if(incomingMessage.user.id === this.userId) {
                context.from = 'You';
                template = this.userMessageTemplateContent;
            } else {
                context.from = incomingMessage.user.username;
                template = this.responseTemplateContent;
            }
            this.chatLogList.append(Mustache.render(template, context));
            this.scrollToBottom();
        },
        socketReady: function(msg) {
            this.userId = msg.id;
            $('.login').fadeOut(300, function() {
                this.textArea.focus();
            }.bind(this));
        },
        deleteMessage: function(msg) {
            console.log('deleteMessage', msg);
            $('[data-ts="' + msg.ts + '"]').fadeOut(300, function() {
                $(this).remove();
            });
        },
        botIsTyping: function() {
            this.typingIndicator.fadeIn(300);
        },
        addReactionTo: function(msg) {
            console.log('addReactionTo', msg);
        },
        processBotMessage: function(msg) {
            this.typingIndicator.fadeOut(300);
            if(msg.to === 'channel' && !msg.channel) {
                this.appendResponse({
                    ts: msg.ts,
                    text: msg.message,
                    user: {
                        username: 'Giskard'
                    }
                });
            } else {
                console.log('processBotMessage', msg);
            }
            this.scrollToBottom();
        },
        userConnected: function(msg) {
            console.log('userConnected', msg);
            this.userList.append(Mustache.render(this.userConnectedTemplate, msg));
            /* username, name, id */
        },
        extraMetadata: function(msg) {
            console.log('extraMetadata', msg);
            var _this = this;
            $('[data-ts="' + msg.ts + '"]').find('.message').append('<br /><a href="' + msg.value + '" target="_blank"><img style="max-width:100%" src="' + msg.value + '" /></a>').find('img').load(function() {
                _this.scrollToBottom();
            });
            /* username, name, id */
        }
    };
    $('#typing').fadeOut(0);
    chat.init();
})();
