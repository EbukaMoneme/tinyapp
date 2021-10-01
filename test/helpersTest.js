const { assert } = require('chai');

const { mailCheck } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('mailCheck', function() {
  it('should return a user with valid email', function() {
    const user = mailCheck(testUsers, "user@example.com")
    const expectedOutput = testUsers.userRandomID;
    assert.strictEqual(user, expectedOutput);
  });
});

describe('mailCheck', function() {
  it('should return a undefined for an email not in the database', function() {
    const user = mailCheck(testUsers, "user3@example.com")
    const expectedOutput = undefined;
    assert.strictEqual(user, expectedOutput);
  });
});