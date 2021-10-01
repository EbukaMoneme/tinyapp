//////////// Set up and dependencies /////////////////
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const morgan = require('morgan');
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['This is a key that Im using to encrypt', '$!2@as125AF42%^&*'],
}))

///////////////////////////////////////////////////////

//////////// Helper Functions /////////////////
const getUrlsForUser = (id) => {
  let userDisplay = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userDisplay[url] = urlDatabase[url];
    }
  }
  return userDisplay;
};

const {getUserByEmail, newUser, newString} = require("./helpers");

//////////////////////////////////////////////

//////////// Constants /////////////////
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ481W"
},
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "aJ481W"
  }
};

const users = { 
  "aJ481W": {
    id: "aJ481W", 
    email: "user@example.com", 
    password: bcrypt.hashSync("purple-monkey", salt)
  },
}
//////////////////////////////////////////////

//////////// Template Renders /////////////////
// Root path
app.get("/", (req, res) => {
  let identity = req.session.user_id;
  if (!identity) {
    res.redirect("/login");
    return
  }
  res.redirect("/urls");
});

// path to show all urls
app.get("/urls", (req, res) => {
  let identity = req.session.user_id;
  if (!identity) {
    res.status(404);
    res.send("You must be <a href = '/login'>logged in</a> to access this.");
    return;
  }
  const templateVars = { 
    urls: getUrlsForUser(identity),
    "user_id": users[identity]
  };
  res.render("urls_index", templateVars);
});

// path to create new URL
app.get("/urls/new", (req, res) => {
  let identity = req.session.user_id;
  if (!identity) {
    return res.redirect("/login");
  }
  const templateVars = { 
    "user_id": users[identity]
  };
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  let identity = req.session.user_id;
  if (identity) {
    res.redirect("/urls");
  }
  const templateVars = { 
    "user_id": users[identity]
  };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  let identity = req.session.user_id;
  if (identity) {
    res.redirect("/urls");
  }
  const templateVars = { 
    "user_id": users[identity]
  };
  res.render("urls_login", templateVars);
});

// path to individual short URL page
app.get("/urls/:shortURL", (req, res) => {
  let identity = req.session.user_id;
  let short = req.params.shortURL;
  if (!urlDatabase[short]) {
    res.status(404);
    res.send("URL does not exist. <a href = '/login'>Go Back!</a>");
    return;
  }
  if (!identity) {
    res.status(403);
    res.send("You must be <a href = '/login'>logged in</a> to access this.");
    return;
  }
  let urlCheck = urlDatabase[short].userID;
  if (identity !== urlCheck) {
    res.status(403);
    res.send("You do not own this URL. <a href = '/login'>Go Back!</a>");
    return;
  }
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL].longURL,
    "user_id": users[identity]
   };
  res.render("urls_show", templateVars);
});

// path connects short URL to long URL
app.get("/u/:shortURL", (req, res) => {
  let short = req.params.shortURL;
  if (!urlDatabase[short]) {
    res.status(404);
    res.send("URL does not exist. <a href = '/login'>Go Back!</a>");
    return;
  }
  const longURL = urlDatabase[short].longURL;
  res.redirect(longURL);
});
//////////////////////////////////////////////

//////////// Page actions and redirects /////////////////
//Recieves form submission and makes new key-value pair in database
app.post("/urls", (req, res) => {
  let identity = req.session.user_id;
  if (!identity) {
    res.status(403);
    res.send("Must be <a href = '/login'>logged in</a> to complete this action");
    return;
  }
  let short = newString();
  let long = req.body.longURL;
  urlDatabase[short] = {
    longURL: long,
    userID: identity,
  }
  res.redirect(`/urls/${short}`);
});

// Delete URL
app.post("/urls/:shortURL/delete", (req, res) => {
  let identity = req.session.user_id;
  if (!identity) {
    res.status(403);
    res.send("You must be <a href = '/login'>logged in</a> to access this.");
    return;
  }
  let short = req.params.shortURL;
  let urlCheck = urlDatabase[short].userID;
  if (identity !== urlCheck) {
    res.status(403);
    res.send("You do not own this URL. <a href = '/login'>Go Back!</a>");
    return;
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect(`/urls`);
});

// Update URL
app.post("/urls/:shortURL", (req, res) => {
  let identity = req.session.user_id;
  if (!identity) {
    res.status(403);
    res.send("You must be <a href = '/login'>logged in</a> to access this.");
    return;
  }
  let short = req.params.shortURL;
  let urlCheck = urlDatabase[short].userID;
  if (identity !== urlCheck) {
    res.status(403);
    res.send("You do not own this URL. <a href = '/login'>Go Back!</a>");
    return;
  }
  let newUrl = req.body.newURL;
  urlDatabase[short].longURL = newUrl;
  res.redirect(`/urls`);
});

// Log user in and set cookies
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(users, email);

  if (!user) {
    res.status(403);
    res.send("Email cannot be found. <a href = '/login'>Go Back!</a>");
    return;
  }
  if (!bcrypt.compareSync(password, user.password)) {
    res.status(403);
    res.send("Incorrect password. <a href = '/login'>Go Back!</a>");
    return;
  }
  req.session.user_id = user.id;
  res.redirect(`/urls`);
});

// Logout user and clear cookies
app.post("/logout", (req, res) => {
  let identity = req.session.user_id;
  const email = req.body.email;
  req.session = null;
  res.redirect(`/login`);
});

// Register user
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    res.status(400);
    res.send("Invalid email or password. <a href = '/register'>Go Back!</a>");
    return;
  }
  if (getUserByEmail(users, email)) {
    res.status(400);
    res.send("Email already in use. <a href = '/register'>Go Back!</a>");
    return;
  }
  const hashpass = bcrypt.hashSync(password, salt);
  const userId = newUser(email, hashpass, users);

  req.session.user_id = userId;
  res.redirect(`/urls`);
});

//////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});

