#!/usr/bin/env node

var program = require('commander');
var async = require('async');

var projects = require('./lib/projects');
var db = require('./lib/db');
var servers = require('./lib/servers');

process.on('uncaughtException', function(err) {
  servers.stopAll(function() {
    console.error(err.stack);
    process.exit(1);
  });
});

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
      },
      projects['CSOL-site'].exec.bind(null, 'npm run-script sync-db'),
      projects['CSOL-site'].exec.bind(null, 'npm run-script migrate-db')
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
      servers.start.bind(null, projects['aestimia'], 'node bin/aestimia.js'),
      servers.start.bind(null, projects['openbadger'], 'node app.js'),
      servers.start.bind(null, projects['CSOL-site'], 'node app.js')
    ], function(err) {
      if (err) throw err;
      console.log("Services started.");
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
