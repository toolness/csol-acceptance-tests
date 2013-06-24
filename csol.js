#!/usr/bin/env node

var program = require('commander');
var async = require('async');

var projects = require('./lib/projects');

program
  .command('init')
  .description('set up initial packages, databases, etc.')
  .action(function() {
    async.series([
      projects['CSOL-site'].exec.bind(null, 'npm install'),
      projects['aestimia'].exec.bind(null, 'npm install'),
      projects['openbadger'].exec.bind(null, 'npm install')
    ], function(err) {
      if (err) throw err;
      console.log("Initialization successful.");
    });
  });

program
  .command('shell <project-name>')
  .description('launch shell in project dir, with environment set')
  .action(function(project) {
    if (!(project in projects)) {
      console.log("Invalid project. Please choose from " +
                  Object.keys(projects).join(", ") + ".");
      process.exit(1);
    }
    projects[project].exec(process.env.SHELL, [], function(err) {
      if (err) throw err;
    });
  });

program.parse(process.argv);

if (program.args.length == 0) {
  program.help();
  process.exit(1);
}
