var _ = require('underscore');
var assert = require('assert');
var fs = require('fs');
var spawn = require('child_process').spawn;

var env = require('./env');
var repoPath = require('./util').repoPath;

function Project(dirname, environment) {
  var self = {};
  var projectDir = repoPath(dirname);
  var fullEnvironment = _.extend({}, process.env, environment);

  self.environment = environment;
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
      stdio: ['ignore', 1, 2]
    });
    console.log("Executing '" + cmdline + "' in " + dirname + ".");
    subprocess.on('close', function(code) {
      if (code !== 0)
        return cb(new Error("process '" + cmdline + "' exited with code " +
                            code));
      cb(null);
    });
  };

  assert(fs.existsSync(projectDir), "dir " + projectDir + " must exist");
  return self;
}

module.exports = {
  aestimia: Project('aestimia', env.AESTIMIA),
  openbadger: Project('openbadger', env.OPENBADGER),
  csolSite: Project('CSOL-site', env.CSOL_SITE)
};
