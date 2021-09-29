//////////// Set up and dependencies /////////////////

const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

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

//////////////////////////////////////////////

//////////// Constants /////////////////
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
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
}
//////////////////////////////////////////////

//////////// Template Renders /////////////////
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = { 
    urls: urlDatabase,
    "user_id": users[req.cookies["user_id"]]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { 
    "user_id": users[req.cookies["user_id"]]
  };
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { 
    "user_id": users[req.cookies["user_id"]]
  };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { 
    "user_id": users[req.cookies["user_id"]]
  };
  res.render("urls_login", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    "user_id": users[req.cookies["user_id"]]
   };
  res.render("urls_show", templateVars);
});
//////////////////////////////////////////////

//////////// Page actions and redirects /////////////////
app.post("/urls", (req, res) => {
  let short = newString();
  let long = req.body.longURL;
  urlDatabase[short] = long;
  res.redirect(`/urls/${short}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect(`/urls`);
});

app.post("/urls/:shortURL", (req, res) => {
  let short = req.params.shortURL;
  let newUrl = req.body.newURL;
  urlDatabase[short] = newUrl;
  res.redirect(`/urls`);
});

app.post("/login", (req, res) => {
  if (!mailCheck(users, req.body.email)) {
    res.status(403);
    res.send("Email cannot be found");
    return
  }
  if (mailCheck(users, req.body.email).password !== req.body.password) {
    res.status(403);
    res.send("Incorrect password");
    return
  }

  res.cookie("user_id", mailCheck(users, req.body.email).id);
  res.redirect(`/urls`);
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id", mailCheck(users, req.body.email).id);
  res.redirect(`/urls`);
});

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400);
    res.send("Invalid email or password");
    return
  }
  if (mailCheck(users, req.body.email)) {
    res.status(400);
    res.send("Email already in use");
    return
  }
  let newUser = newString();
  let user = {
    id: newUser,
    email: req.body.email,
    password: req.body.password,
  }
  users[newUser] = user;
  console.log(users);
  res.cookie("user_id", newUser);
  res.redirect(`/urls`);
});

app.get("/u/:shortURL", (req, res) => {
  let short = req.params.shortURL;
  const longURL = urlDatabase[short];
  res.redirect(longURL);
});

//////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});

