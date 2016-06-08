var program = require('commander'),
    pkg = require('../package.json');
program
    .version(pkg.version)
    .option('-i, --install-deps', 'Installs an initial module that adds module-managing capabilities')
    .parse(process.argv);

require('./bot').sharedInstance().bootstrap(program)
