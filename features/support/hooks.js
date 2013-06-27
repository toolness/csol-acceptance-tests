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
  console.error(err.stack);
  servers.stopAll(function() {
    process.exit(1);
  });
});

function showWebdriverDebugOutput(asyncBrowser) {
  asyncBrowser.on('status', function(info) {
    console.info(info.cyan);
  });

  asyncBrowser.on('command', function(meth, path, data) {
    console.info(' > ' + meth.yellow, path.grey, data || '');
  });  
}

function startTasks(phantom, asyncBrowser) {
  var startServer = Future.wrap(servers.start);
  var concurrentTasks = [
    startServer(phantom),
    Future.wrap(aestimia.resetDb)(),
    Future.wrap(openbadger.resetDb)(),
    Future.wrap(csolSite.resetDb)(),
  ];

  Future.wait(concurrentTasks);
  
  var initBrowser = Future.wrap(function(cb) {
    asyncBrowser.init(cb);
  });
  concurrentTasks = [
    startServer(aestimia),
    startServer(openbadger),
    initBrowser()
  ];

  Future.wait(concurrentTasks);
  startServer(csolSite).wait();
}

module.exports = fiberize(function() {
  this.Before(function() {
    var setupStartTime = Date.now();
    var phantom = Phantom();
    var asyncBrowser = phantom.createWebdriver();

    if ('DEBUG' in process.env) {
      showWebdriverDebugOutput(asyncBrowser);
    } else {
      projects.stderr = projects.stdout = 'ignore';
      console.info = function() {};
    }

    startTasks(phantom, asyncBrowser);
    this.aestimia = aestimia;
    this.csolSite = csolSite;
    this.openbadger = openbadger;
    this.browser = new FiberWebdriverObject(asyncBrowser);
    this._scenarioStartTime = Date.now();
    console.info("Scenario setup completed in " +
                 (this._scenarioStartTime - setupStartTime) + " ms.");
  });

  this.After(function() {
    var stopServers = Future.wrap(servers.stopAll);

    console.info("Scenario steps completed in " +
                 (Date.now() - this._scenarioStartTime) + " ms.");
    this.browser.quit();
    stopServers().wait();
  });
});
