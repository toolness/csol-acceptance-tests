Feature: Signing Up

  Scenario: Learner attempts to sign up
    When a user visits the CSOL website
    And they click on the link labeled "sign up"
    Then they should see the sign up form
