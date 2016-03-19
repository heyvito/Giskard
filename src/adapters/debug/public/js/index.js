$(function() {
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
                .on('user_disconnected', this.userDisconnected.bind(this))
                .on('extra_metadata', this.extraMetadata.bind(this));
            if(window.localStorage) {
                $('#name').val(window.localStorage.getItem('lastName'));
                $('#username').val(window.localStorage.getItem('lastUser'));
            }
        },
        addUser: function(user) {
            if ($('[data-user-id="' + user.id + '"]').length === 0) {
                this.userList.append(Mustache.render(this.userConnectedTemplate, user));
            }
        },
        performLogin: function(e) {
            e.preventDefault();
            e.stopPropagation();
            var n = $('#name').val(),
                u = $('#username').val();
            this.socket.emit('identify', {
                name:       n,
                username:   u
            });
            if(window.localStorage) {
                window.localStorage.setItem('lastName', n);
                window.localStorage.setItem('lastUser', u);
            }
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
            var context = {
                time: new Date().toLocaleTimeString().replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3"),
                ts: incomingMessage.ts,
                response: this.formatText(incomingMessage.text),
                channel: incomingMessage.channel
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
            msg.userList.forEach(this.addUser.bind(this));
        },
        deleteMessage: function(msg) {
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
            this.appendResponse({
                ts: msg.ts,
                text: msg.message,
                channel: msg.channel,
                user: {
                    username: 'Giskard'
                }
            });
            this.scrollToBottom();
        },
        userConnected: function(msg) {
            this.addUser(msg);
        },
        userDisconnected: function(msg) {
            $('[data-user-id="' + msg.id + '"]').remove();
        },
        extraMetadata: function(msg) {
            var _this = this;
            $('[data-ts="' + msg.ts + '"]').find('.message').append('<br /><a href="' + msg.value + '" target="_blank"><img style="max-width:100%" src="' + msg.value + '" /></a>').find('img').load(function() {
                _this.scrollToBottom();
            });
        },
        formatText: function(txt) {
            txt = txt
                .replace(/>/g, '&gt;')
                .replace(/</g, '&lt;')
                .replace(/@([a-zA-Z1-9_]+)/g, function(s, m) {
                    return '@<u>' + m + '</u>';
                })
                .replace(/\*([^\n]+)\*/g, function(s, m) {
                    return '<strong>' + m + '</strong>';
                })
                .replace(/_([^\n]+)_/g, function(s, m) {
                    return '<em>' + m + '</em>';
                })
                .replace(/`([^`\n]+)`/g, function(s, m) {
                    return '<code>' + m + '</code>';
                })
                .split('\n');
            var result = [],
                inB = false,
                inC = false;
            txt.forEach(function(i) {
                if(i.indexOf('&gt;') === 0 && !inB && !inC) {
                    result.push('<blockquote>' + i.replace('&gt;', '').trimLeft() + '<br/>');
                    inB = true;
                } else if(i.indexOf('&gt;') === -1 && inB && !inC) {
                    result.push('</blockquote><br/>');
                    result.push(i + '<br/>');
                    inB = false;
                } else if(i === '```') {
                    inC = !inC;
                    if(inC) {
                        result.push('<pre class="preform">');
                    } else {
                        result.push('</pre>');
                    }
                } else {
                    if(inB && !inC) {
                        result.push(i.replace('&gt;', '').trimLeft() + '<br/>');
                    } else if(!inB && inC) {
                        result.push(i + '\n');
                    } else {
                        result.push(i + '<br/>');
                    }
                }
            });

            return result.join('').replace(/<br\/><br\/>/g, '<br/>');
        }
    };
    $('#typing').fadeOut(0);
    chat.init();
});
