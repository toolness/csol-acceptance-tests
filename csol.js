#!/usr/bin/env node

var program = require('commander');
var async = require('async');

var projects = require('./lib/projects');

program
  .command('init')
  .description('set up initial packages, databases, etc.')
  .action(function() {
    async.series([
      projects.csolSite.exec.bind(null, 'npm install'),
      projects.aestimia.exec.bind(null, 'npm install'),
      projects.openbadger.exec.bind(null, 'npm install')
    ], function(err) {
      if (err) throw err;
      console.log("Initialization successful.");
    });
  });

program.parse(process.argv);

if (program.args.length == 0) {
  program.help();
  process.exit(1);
}
