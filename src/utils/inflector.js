var logger = require('./logger')('Inflector'),
    settings = require('../models/settings').sharedInstance(),
    Path = require('path'),
    fs = require('fs');

var Inflector = function(input, rules) {
    this.rules = rules;
    this.input = input || '';
    this.mode = Inflector.SINGULARIZE;
    logger.silly(`Initialised with language: ${rules.language}`);
};

Inflector.SINGULARIZE = 1;
Inflector.PLURALIZE = 2;

Inflector.prototype = {
    rulesForMode: function() {
        return this.rules[this.mode === Inflector.SINGULARIZE ? 'singular' : 'plural'] || [];
    },
    applyRulesOnWord: function(w) {
        return new Promise((resolve, reject) => {
            var irregularSearchIndex = this.mode === Inflector.SINGULARIZE ? 1 : 0,
                irregularResultIndex = this.mode === Inflector.SINGULARIZE ? 0 : 1;
            if(this.rules.irregulars) {
                var searchResult = this.rules.irregulars
                    .find(i => i[irregularSearchIndex] === w);
                if(searchResult) {
                    return resolve(searchResult[irregularResultIndex]);
                }
            }
            var rules = this.rulesForMode(),
                rp, i;
            for(i in rules) {
                rp = rules[i];
                if(rp[0].test(w)) {
                    return resolve(rp[1].replace('$', rp[0].exec(w)[1]));
                }
            };
            resolve(w);
        }).then(i => { console.log(i); return i; });
    },
    normaliseInput: function() {
        return Promise.all(this.input.toLowerCase()
                .replace(/\?|\!|\.|,/g, '')
                .replace(/\s{2,}/g, ' ')
                .split(' ')
                .filter(w => this.rules.articles.indexOf(w) === -1)
                .join(' ')
                .normalize('NFKD')
                .replace(/[\u0300-\u036F]/g, '')
                .split(' ')
                .map(w => this.applyRulesOnWord(w)))
            .then(wa => wa.join(' '));
    }
};

Inflector.getInstance = function(input) {
    var rules;
    try {
        rules = require(Path.join(settings.rootDir, 'src', 'utils', 'dicts', `${settings.inflectorDictionaryName}.js`));
    } catch(ex) {
        logger.error('Error loading inflection dictionary: ');
        logger.error(ex);
        rules = {};
    }
    return new Inflector(input, rules);
}

module.exports = Inflector;
