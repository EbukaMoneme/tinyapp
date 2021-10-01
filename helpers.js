const getUserByEmail = (userObj, email) => {
  for (let user in userObj) {
    if (userObj[user].email === email) {
      return userObj[user];
    }
  }
  return undefined;
};

const newString = ()  => {
  return Math.random().toString(36).substr(2, 6);
};

const newUser = (email, password, db) => {
  const id = newString();
  db[id] = {
    id,
    email,
    password
  };
  return id
};

module.exports = {getUserByEmail, newUser, newString};