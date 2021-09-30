//////////// Set up and dependencies /////////////////

const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const morgan = require('morgan');
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['This is a key that Im using to encrypt', '$!2@as125AF42%^&*'],
}))

///////////////////////////////////////////////////////

//////////// Functions /////////////////
const newString = ()  => {
  return Math.random().toString(36).substr(2, 6);
}

const mailCheck = (userObj, email) => {
  for (let user in userObj) {
    if (userObj[user].email === email) {
      return userObj[user];
    }
  }
  return false;
}

const newUser = (email, password, db) => {
  const id = newString();
  db[id] = {
    id,
    email,
    password
  };
  return id
}

const urlsForUser = (id) => {
  let userDisplay = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userDisplay[url] = urlDatabase[url];
    }
  }
  return userDisplay;
}

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
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/urls", (req, res) => {
  let identity = req.session.user_id;
  if (!identity) {
    res.status(404)
    res.send("You must be logged in to access this.")
  }
  const templateVars = { 
    urls: urlsForUser(identity),
    "user_id": users[identity]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let identity = req.session.user_id;
  console.log(identity? true: false)
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

app.get("/urls/:shortURL", (req, res) => {
  let identity = req.session.user_id;
  if (!identity) {
    res.status(403)
    res.send("You must be logged in to access this.")
  }
  let short = req.params.shortURL
  let urlCheck = urlDatabase[short].userID;
  if (identity !== urlCheck) {
    res.status(403)
    res.send("You do not own this URL")
  }
  // console.log(req.params)
  // console.log(req.cookies)
  // console.log(urlDatabase[req.params.shortURL].userID)
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL].longURL,
    "user_id": users[identity]
   };
  res.render("urls_show", templateVars);
});
//////////////////////////////////////////////

//////////// Page actions and redirects /////////////////
app.post("/urls", (req, res) => {
  let identity = req.session.user_id;
  if (!identity) {
    res.status(403);
    res.send("Must be logged in to complete this action");
    return
  }
  let short = newString();
  let long = req.body.longURL;
  urlDatabase[short] = {
    longURL: long,
    userID: identity,
  }
  console.log(urlDatabase)
  res.redirect(`/urls/${short}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let identity = req.session.user_id;
  if (!identity) {
    res.status(403)
    res.send("You must be logged in to access this.")
  }
  let short = req.params.shortURL
  let urlCheck = urlDatabase[short].userID;
  if (identity !== urlCheck) {
    res.status(403)
    res.send("You do not own this URL")
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect(`/urls`);
});

app.post("/urls/:shortURL", (req, res) => {
  let identity = req.session.user_id;
  if (!identity) {
    res.status(403)
    res.send("You must be logged in to access this.")
  }
  let short = req.params.shortURL
  let urlCheck = urlDatabase[short].userID;
  if (identity !== urlCheck) {
    res.status(403)
    res.send("You do not own this URL")
  }
  let newUrl = req.body.newURL;
  urlDatabase[short].longURL = newUrl;
  res.redirect(`/urls`);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = mailCheck(users, email);

  if (!user) {
    res.status(403);
    res.send("Email cannot be found");
    return
  }
  if (!bcrypt.compareSync(password, user.password)) {
  // if (user.password !== password) {
    res.status(403);
    res.send("Incorrect password");
    return
  }

  req.session.user_id = user.id;
  res.redirect(`/urls`);
});

app.post("/logout", (req, res) => {
  let identity = req.session.user_id;
  const email = req.body.email;
  req.session = null;
  // res.clearCookie("user_id", mailCheck(users, email).id);
  res.redirect(`/login`);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    res.status(400);
    res.send("Invalid email or password");
    return
  }
  if (mailCheck(users, email)) {
    res.status(400);
    res.send("Email already in use");
    return
  }
  const hashpass = bcrypt.hashSync(password, salt);
  const userId = newUser(email, hashpass, users);

  console.log(users);
  req.session.user_id = userId;
  res.redirect(`/urls`);
});

app.get("/u/:shortURL", (req, res) => {
  let short = req.params.shortURL;
  console.log(urlDatabase);
  if (!urlDatabase[short]) {
    res.status(404);
    res.send("Invalid link");
    return
  }
  const longURL = urlDatabase[short].longURL;
  res.redirect(longURL);
});

//////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});

