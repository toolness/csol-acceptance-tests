var _ = require('underscore');
var assert = require('assert');
var fs = require('fs');
var spawn = require('child_process').spawn;
var async = require('async');
var mysql = require('mysql');
var mongodb = require('mongodb');

var env = require('./env');
var repoPath = require('./util').repoPath;

function Project(options) {
  var self = {};

  var dirname = options.dirname;
  var startCommand = options.startCommand;
  var environment = options.environment;
  var resetDb = options.resetDb;

  var projectDir = repoPath(dirname);
  var fullEnvironment = _.extend({}, process.env, environment);

  self.name = dirname;
  self.env = environment;
  self.startCommand = startCommand;
  self.url = 'http://localhost:' + environment.PORT + '/';
  self.startServer = function(cb) {
    return self.exec(self.startCommand, cb || function() {});
  };
  self.resetDb = function(cb) {
    console.log("Resetting database for " + self.name + ".");
    resetDb.call(self, cb);
  };
  self.exec = function(cmd, args, cb) {
    if (typeof(args) == 'function') {
      cb = args;
      args = cmd.split(' ').slice(1);
      cmd = cmd.split(' ')[0];
    }

    var cmdline = cmd + (args.length ? ' ' + args.join(',') : '');
    var subprocess = spawn(cmd, args, {
      cwd: projectDir,
      env: fullEnvironment,
      stdio: [0, 1, 2]
    });
    console.log("Executing '" + cmdline + "' in " + dirname + ".");
    subprocess.on('close', function(code) {
      if (code !== 0)
        return cb(new Error("process '" + cmdline + "' exited with code " +
                            code));
      cb(null);
    });
    return subprocess;
  };

  assert(fs.existsSync(projectDir), "dir " + projectDir + " must exist");
  return self;
}

module.exports = {
  'aestimia': Project({
    dirname: 'aestimia',
    startCommand: 'node bin/aestimia.js',
    environment: env.AESTIMIA,
    resetDb: function(callback) {
      mongodb.MongoClient.connect(this.env.MONGO_URL, function(err, db) {
        if (err) return callback(err);
        db.dropDatabase(function(err) {
          if (err) return callback(err);
          db.close(callback);
        });
      });
    }
  }),
  'openbadger': Project({
    dirname: 'openbadger',
    startCommand: 'node app.js',
    environment: env.OPENBADGER,
    resetDb: function(callback) {
      var server = new mongodb.Server(this.env.OPENBADGER_MONGO_HOST,
                                      this.env.OPENBADGER_MONGO_PORT);
      var client = new mongodb.MongoClient(server);
      client.open(function(err, client) {
        if (err) return callback(err);
        client.close(callback);
      });
    }
  }),
  'CSOL-site': Project({
    dirname: 'CSOL-site',
    startCommand: 'node app.js',
    environment: env.CSOL_SITE,
    resetDb: function(callback) {
      var env = this.env;
      async.series([
        function createDatabase(cb) {
          var conn = mysql.createConnection({
            host: env.CSOL_DB_HOST,
            port: env.CSOL_DB_PORT,
            user: env.CSOL_DB_USER,
            password: env.CSOL_DB_PASS,
          });
          conn.connect();
          conn.query('CREATE DATABASE IF NOT EXISTS ' + env.CSOL_DB_NAME +
                     ';', cb);
          conn.end();
        },
        this.exec.bind(null, 'node bin/sync-db')
      ], callback);
    }
  })
};
