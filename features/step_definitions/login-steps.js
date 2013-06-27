var fiberize = require('./../../lib/fiber-cucumber.js');

module.exports = fiberize(function() {
  this.When(/^a user visits the CSOL website$/, function() {
    this.browser.get(this.csolSite.url);
  });

  this.When(/^they click on the link labeled "([^"]*)"$/, function(label) {
    this.browser.elementByLinkText(label).click();
  });

  this.Then(/^they should see the sign up form$/, function() {
    this.browser.elementByCssSelector("#input-birthday-month");
  });
});
