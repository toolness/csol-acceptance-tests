#!/usr/bin/env node

var program = require('commander');
var async = require('async');

var projects = require('./lib/projects');
var db = require('./lib/db');

program
  .command('init')
  .description('set up initial packages, databases, etc.')
  .action(function() {
    async.series([
      projects['CSOL-site'].exec.bind(null, 'npm install'),
      projects['aestimia'].exec.bind(null, 'npm install'),
      projects['openbadger'].exec.bind(null, 'npm install'),
      function(cb) {
        console.log('Creating CSOL MySQL database.');
        db.create({
          host: projects['CSOL-site'].env.CSOL_DB_HOST,
          port: projects['CSOL-site'].env.CSOL_DB_PORT,
          user: projects['CSOL-site'].env.CSOL_DB_USER,
          password: projects['CSOL-site'].env.CSOL_DB_PASS,
          db: projects['CSOL-site'].env.CSOL_DB_NAME
        }, cb);
      }
    ], function(err) {
      if (err) throw err;
      console.log("Initialization successful.");
    });
  });

program
  .command('start')
  .description('start all services')
  .action(function() {
    async.series([
      projects['CSOL-site'].exec.bind(null, 'npm run-script sync-db'),
      projects['CSOL-site'].exec.bind(null, 'npm run-script migrate-db'),
      function(cb) {
        async.parallel([
          projects['CSOL-site'].exec.bind(null, 'node app.js'),
          projects['aestimia'].exec.bind(null, 'node bin/aestimia.js'),
          projects['openbadger'].exec.bind(null, 'node app.js'),
        ], cb);
      }
    ], function(err) {
      if (err) throw err;
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
