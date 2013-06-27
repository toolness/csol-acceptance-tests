var fiberize = require('./../../lib/fiber-cucumber.js');

module.exports = function() {
  this.When(/^a user visits the CSOL website$/, fiberize(function() {
    this.browser.get(this.csolSite.url);
  }));

  this.When(/^they click on the link labeled "([^"]*)"$/, fiberize(function(label) {
    var elem = this.browser.elementByLinkText(label);
    elem.click();
  }));

  this.Then(/^they should see the sign up form$/, fiberize(function() {
    this.browser.elementByCssSelector("#input-birthday-month");
  }));
};
