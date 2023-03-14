const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const Activity = require("../models/Activity.model");
const mongoose = require("mongoose");
// Import the middleware for authentication here
const { isLoggedIn } = require("../middleware/routeguard");

const bcryptjs = require("bcryptjs");
const { userInfo } = require("os");
const saltRounds = 10;

router.get("/home", isLoggedIn, async (req, res, next) => {

  const userId = req.session.currentUser._id;
  //set to Midnight of the current day so the gte checks return something
  const currentDate = new Date(new Date().setHours(1, 0, 0, 0))
  const tomorrow = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowMidnight = new Date(tomorrow.setHours(0, 0, 0, 0));

	try {
		// Find all activities that have a specific date within the next two weeks
    const user = await User.findById(userId)
		const activities = await Activity.find({
			userId: userId,
			specificDate: {
				$gte: currentDate,
				$lt: tomorrowMidnight,
			},
		});

		// Filter the activities to only include those within the coming week
		const comingWeekActivities = activities.filter((activity) => {
			const activityDate = new Date(activity.specificDate);
			return activityDate >= currentDate && activityDate < tomorrowMidnight;
		});

		// Send the coming week activities as the response
		res.render('home', { user, comingWeekActivities: comingWeekActivities});

  } catch (error) {
next(error)

  }

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

  const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?]).{6,}/;
  if (!regex.test(password)) {
    res.status(500).render("auth/sign-up", {
      errorMessage:
        "Password needs to have at least 8 characters and must contain at least one special character, one number, one lowercase and one uppercase letter."
    });
    return;
  }

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

router.post('/logout', isLoggedIn, (req,res) => {
  req.session.destroy();
  res.redirect("/");

})

module.exports = router;
