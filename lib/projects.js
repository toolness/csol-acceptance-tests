var _ = require('underscore');
var assert = require('assert');
var fs = require('fs');
var spawn = require('child_process').spawn;

var env = require('./env');
var repoPath = require('./util').repoPath;

function Project(dirname, startCommand, environment) {
  var self = {};
  var projectDir = repoPath(dirname);
  var fullEnvironment = _.extend({}, process.env, environment);

  self.name = dirname;
  self.env = environment;
  self.startCommand = startCommand;
  self.url = 'http://localhost:' + environment.PORT + '/';
  self.startServer = function(cb) {
    return self.exec(self.startCommand, cb || function() {});
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
  'aestimia': Project('aestimia', 'node bin/aestimia.js', env.AESTIMIA),
  'openbadger': Project('openbadger', 'node app.js', env.OPENBADGER),
  'CSOL-site': Project('CSOL-site', 'node app.js', env.CSOL_SITE)
};
