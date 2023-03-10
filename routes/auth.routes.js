const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const mongoose = require("mongoose");
// Import the middleware for authentication here
const { isLoggedIn } = require("../middleware/routeguard");

const bcryptjs = require("bcryptjs");
const { userInfo } = require("os");
const saltRounds = 10;

router.get("/home", isLoggedIn, (req, res, next) => {
  res.render("home");
});

router.get("/signup", (req, res, next) => {
  const loggedOut = "You are still logged out"
  res.render("auth/sign-up", {loggedOut: loggedOut});
});

router.post("/signup", async (req, res, next) => {
  const { username, password, confirm } = req.body;
  const loggedOut = "You are still logged out"

  //make sure the user provides both required inputs
  if (!username || !password || !confirm) {
    res.render("auth/sign-up", {
      errorMessage:
        "All fields are mandatory. Please provide username and password.",
    });
  }
  //password and confirmation need to match
  if (password !== confirm) {
    res.render("auth/sign-up", { errorMessage: "Passwords do not match", loggedOut: loggedOut });
  }

  //TODO include regex here to make password restrictive?

  try {
    //create Salt
    const salt = await bcryptjs.genSalt(saltRounds);
    //create a Hash from the Salt and the user's password
    const passwordHash = await bcryptjs.hash(password, salt);
    //create a new User in the DB with the Username and the password hash
    const newUser = await User.create({ username, password: passwordHash });
    //redirect the new User directly to the login page
    res.redirect("/login");
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(500).render("auth/sign-up", { errorMessage: error.message, loggedOut: loggedOut });
    } else if (error.code === 11000) {
      res.status(500).render("auth/sign-up", {
        errorMessage:
          "The username needs to be unique. Username already in use.", loggedOut: loggedOut
      });
    } else {
      next(error);
    }
  }
});

router.get("/login", (req, res, next) => {
  const loggedOut = "You are still logged out"
  res.render("auth/login", {loggedOut: loggedOut});
});

router.post("/login", async (req, res, next) => {
  console.log("SESSION =====> ", req.session);
  const { username, password } = req.body;
  const loggedOut = "You are still logged out"

  if (username === "" || password === "") {
    res.render("auth/login", {
      errorMessage: "Please enter both username and password to log in.", loggedOut: loggedOut
    });
    return;
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      //user isn't found
      res.render("auth/login", {
        errorMessage: "Username is not registered. Try with other username.", loggedOut: loggedOut
      });
      return;
    } else if (bcryptjs.compareSync(password, user.password)) {
      //if password hashes match, user is the current User and can proceed to home screen
      req.session.currentUser = user;
      res.redirect("/home");
    } else {
      res.render("auth/login", {
        errorMessage: "Incorrect password.", loggedOut: loggedOut
      });
    }
  } catch (error) {
    console.log("Error with POST Login route", error);
    next(error);
  }
});

module.exports = router;
