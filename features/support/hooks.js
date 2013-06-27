var colors = require('colors');
var Future = require('fibers/future');

var fiberize = require('./../../lib/fiber-cucumber.js');
var projects = require('./../../lib/projects');
var servers = require('./../../lib/servers');
var Phantom = require('./../../lib/phantom');
var FiberWebdriverObject = require('./../../lib/fiber-webdriver');

var aestimia = projects['aestimia'];
var csolSite = projects['CSOL-site'];
var openbadger = projects['openbadger'];

process.on('uncaughtException', function(err) {
  console.log("FUK", err.stack);
  servers.stopAll(function() {
    console.error(err.stack);
    process.exit(1);
  });
});

function startServers(phantom) {
  var startServer = Future.wrap(servers.start);

  [aestimia, openbadger, csolSite].forEach(function(project) {
    var resetDb = Future.wrap(project.resetDb);
    resetDb().wait();    
    startServer(project).wait();
  });

  startServer(phantom).wait();
}

module.exports = function() {
  this.Before(fiberize(function() {
    var phantom = Phantom();
    var asyncBrowser = phantom.createWebdriver();

    if ('DEBUG' in process.env) {
      asyncBrowser.on('status', function(info) {
        console.info(info.cyan);
      });

      asyncBrowser.on('command', function(meth, path, data) {
        console.info(' > ' + meth.yellow, path.grey, data || '');
      });
    } else {
      projects.stderr = projects.stdout = 'ignore';
      console.info = function() {};
    }

    startServers(phantom);
    this.aestimia = aestimia;
    this.csolSite = csolSite;
    this.openbadger = openbadger;
    this.browser = new FiberWebdriverObject(asyncBrowser);
    this.browser.init();
  }));

  this.After(fiberize(function() {
    var stopServers = Future.wrap(servers.stopAll);

    this.browser.quit();
    stopServers().wait();
  }));
};
