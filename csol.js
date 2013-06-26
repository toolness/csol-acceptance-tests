#!/usr/bin/env node

var program = require('commander');
var async = require('async');

var projects = require('./lib/projects');
var db = require('./lib/db');
var servers = require('./lib/servers');
var acceptanceTests = require('./lib/acceptance-tests');
var Phantom = require('./lib/phantom');

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
      projects['CSOL-site'].exec.bind(null, 'node bin/sync-db'),
      projects['CSOL-site'].exec.bind(null, 'node bin/migrate-db')
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
      servers.start.bind(null, projects['aestimia']),
      servers.start.bind(null, projects['openbadger']),
      servers.start.bind(null, projects['CSOL-site'])
    ], function(err) {
      if (err) throw err;
      console.log("Services started.");
      Object.keys(projects).forEach(function(name) {
        console.log(name + " is accessible at " + projects[name].url);
      });
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

program
  .command('test')
  .description('run acceptance tests')
  .action(function() {
    var phantom = Phantom();
    async.series([
      servers.start.bind(null, projects['aestimia']),
      servers.start.bind(null, projects['openbadger']),
      servers.start.bind(null, projects['CSOL-site']),
      servers.start.bind(null, phantom),
      acceptanceTests.run.bind(null, phantom.createWebdriver()),
      servers.stopAll
    ], function(err) {
      if (err) throw err;
      console.log("Acceptance tests successful.");
    });
  });

program.parse(process.argv);

if (program.args.length == 0) {
  program.help();
  process.exit(1);
}
