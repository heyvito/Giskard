var rp = require('request'),
    http = require('http'),
    https = require('https'),
    fileType = require('file-type');

var UrlChecker = function() {
    return this;
}

UrlChecker.prototype = {
    checkUrl: function(url, ts) {
        var method;
        if(url.indexOf('https') === 0) {
            method = https;
        } else if(url.indexOf('http') === 0) {
            method = http;
        }

        return new Promise((resolve) => {
            if(method) {
                method.get(url, res => {
                    res.once('data', chunk => {
                        res.destroy();
                        var ft = fileType(chunk);
                        if(ft && ft.mime) {
                            if(ft.mime.indexOf('image') === 0) {
                                resolve({
                                    ts: ts,
                                    type: 'image',
                                    value: url
                                });
                            }
                        }
                    });
                });
            }
        });
    }
};

module.exports = UrlChecker;
