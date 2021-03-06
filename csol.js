#!/usr/bin/env node

var path = require('path');
var spawn = require('child_process').spawn;
var program = require('commander');
var async = require('async');

var projects = require('./lib/projects');
var servers = require('./lib/servers');

var resetDbs = [
  projects['CSOL-site'].resetDb,
  projects['aestimia'].resetDb,
  projects['openbadger'].resetDb
];

process.on('uncaughtException', function(err) {
  servers.stopAll(function() {
    console.error(err.stack);
    process.exit(1);
  });
});

program
  .option('-v, --verbose', 'verbose logging');

program
  .command('init')
  .description('set up initial packages, databases, etc.')
  .action(function() {
    async.series([
      projects['CSOL-site'].exec.bind(null, 'npm install'),
      projects['aestimia'].exec.bind(null, 'npm install'),
      projects['openbadger'].exec.bind(null, 'npm install')
    ].concat(resetDbs), function(err) {
      if (err) throw err;
      console.log("Initialization successful.");
    });
  });

program
  .command('reset')
  .description('wipe all databases and reset their state')
  .action(function() {
    async.series(resetDbs, function(err) {
      if (err) throw err;
      console.log("All databases wiped and reset.");
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
    if (program.verbose)
      process.env.DEBUG = '';
    var cucumber = spawn('node', [
      path.join(__dirname, 'node_modules', '.bin', 'cucumber'),
      '--format', 'pretty'
    ], {
      cwd: __dirname,
      stdio: [0, 1, 2]
    });
    cucumber.on('exit', process.exit.bind(process));
  });

program.parse(process.argv);

if (program.args.length == 0) {
  program.help();
  process.exit(1);
}
