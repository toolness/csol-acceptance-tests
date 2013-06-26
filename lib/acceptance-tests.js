var colors = require('colors');
var Fiber = require('fibers');

var FiberWebdriverObject = require('./fiber-webdriver');

// This is just a sample test. We'll eventually want to run tests
// defined by cucumber scenarios/mocha/etc.
function runSampleTestInFiber(browser) {
  var sessionID = browser.init({browserName: 'chrome'});

  console.log("sessionID", sessionID);
  browser.get("http://localhost:3000/");
  var elem = browser.elementByLinkText("sign up");

  elem.click();
  browser.quit();
}

exports.run = function(asyncBrowser, cb) {
  asyncBrowser.on('status', function(info) {
    console.log(info.cyan);
  });

  asyncBrowser.on('command', function(meth, path, data) {
    console.log(' > ' + meth.yellow, path.grey, data || '');
  });

  Fiber(function() {
    try {
      runSampleTestInFiber(new FiberWebdriverObject(asyncBrowser));
    } catch (err) {
      return cb(err);
    }
    cb();
  }).run();
};
