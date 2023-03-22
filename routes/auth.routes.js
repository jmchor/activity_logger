const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const Activity = require("../models/Activity.model");
const mongoose = require("mongoose");
const axios = require("axios");
// Import the middleware for authentication here
const { isLoggedIn } = require("../middleware/routeguard");

const bcryptjs = require("bcryptjs");
const { userInfo } = require("os");
const saltRounds = 10;

router.get("/home", isLoggedIn, async (req, res, next) => {

  const userId = req.session.currentUser._id;
  //set to Midnight of the current day so the gte checks return something
  const currentDate = new Date(new Date().setHours(0, 0, 0, 0))
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
			return activityDate >= currentDate && activityDate <= tomorrowMidnight;
		});

    let facts = [];
    if (!req.session.facts || req.session.facts.length === 0) {
		const response = await axios.get('https://api.api-ninjas.com/v1/facts?limit=30', {
			headers: {
				'X-Api-Key': process.env.FACT_API_KEY,
			},
		});
		facts = response.data.map((item) => item.fact);
		req.session.facts = facts;
    } else {
		facts = req.session.facts;
    }

    // Use a fact from the array
    const fact = facts.shift();

    // Refetch 30 facts when the array is empty
    if (facts.length === 1) {
		const response = await axios.get('https://api.api-ninjas.com/v1/facts?limit=30', {
			headers: {
				'X-Api-Key': process.env.FACT_API_KEY,
			},
		});
		facts = response.data.map((item) => item.fact);
		req.session.facts = facts;
    }

		// Send the coming week activities as the response
		res.render('home', { user, comingWeekActivities: comingWeekActivities, fact:fact});

  } catch (error) {
    const user = req.session.currentUser;
    const defaultFact = [
      "The first computer mouse was made out of wood? It was invented by Douglas Engelbart in 1964.",
      "If you sneeze too hard, you could fracture a rib",
      "The average person falls asleep in seven minutes",
      "Wearing headphones for just an hour could increase the bacteria in your ear by 700 times",
      "In the course of an average lifetime, while sleeping you might eat around 70 assorted insects and 10 spiders, or more"
    ];

    let randomFact = Math.floor(Math.random() * defaultFact.length);
    const fact = defaultFact[randomFact];

    const errorMessage = "Something went wrong. Please reload the page.";

    res.render('home', { fact: fact, user: user, errorMessage: errorMessage} );
    next(error);
  }

});


router.get("/signup", (req, res, next) => {
  const loggedOut = "You are still logged out"
  res.render("auth/sign-up", {loggedOut: loggedOut});
});

router.post("/signup", async (req, res, next) => {
  const { username, email, password, confirm, securityQuestion, passwordResetAnswer } = req.body;
  const loggedOut = "You are still logged out"

  //make sure the user provides both required inputs
  if (!username || !email || !password || !confirm) {
    res.render("auth/sign-up", {
      errorMessage:
        "All fields are mandatory. Please provide username and password.",
    });
  }
  //password and confirmation need to match
  if (password !== confirm) {
    res.render("auth/sign-up", { errorMessage: "Passwords do not match", loggedOut: loggedOut });
  }

  const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?\-]).{8,}/;
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
    const answerHash = await bcryptjs.hash(passwordResetAnswer, salt);
    //create a new User in the DB with the Username and the password hash
    const newUser = await User.create({ username, email, securityQuestion, passwordResetAnswer: answerHash, password: passwordHash });
    //redirect the new User directly to the login page
    res.redirect("/login");
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(500).render("auth/sign-up", { errorMessage: error.message, loggedOut: loggedOut });
    } else if (error.code === 11000) {
      res.status(500).render("auth/sign-up", {
        errorMessage:
          "The username and email need to be unique. Username or email already in use.", loggedOut: loggedOut
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

  const { username, password, rememberMe } = req.body;
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

      const cookieExpiration = rememberMe ? 24 * 60 * 60000 : 30 * 60 * 1000;
      req.session.cookie.maxAge = cookieExpiration;
      req.session.currentUser = user;

      console.log("SESSION =====> ", req.session);

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

router.get('/profile', isLoggedIn, async (req, res) => {

 const userId = req.session.currentUser._id;

  try {
    const findUser = await User.findById(userId);
    const date = findUser.createdAt;
    const memberDate = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    res.render('profile', { user: findUser, memberDate: memberDate });
  } catch (error) {
next(error)
  }



});



router.get('/profile/statistics', isLoggedIn, async (req, res, next) => {
	const  userId  = req.session.currentUser._id;

  console.log(userId)

	try {

    const now = new Date();
    const dayOfTheWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysSinceMonday = dayOfTheWeek === 0 ? 6 : dayOfTheWeek - 1; // adjust for Sunday
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday);
    const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - daysSinceMonday));

    //Just for development purposes

    //  let dls = now.getTimezoneOffset();

    //   if (dls === -60) {
    //     monday.setHours(1, 0, 0, 0);
    //     sunday.setHours(1, 0, 0, 0);
    //   } else if (dls === -120) {
    //     monday.setHours(2, 0, 0, 0);
    //     sunday.setHours(2, 0, 0, 0);
    //   }


    const weekDates = [];

    for (let date = new Date(monday); date <= sunday; date.setDate(date.getDate() + 1)) {
      weekDates.push(new Date(date));
    }

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);


	  const today = new Date();

    const activities = await Activity.find({
			userId: userId,
			specificDate: {
				$gte: weekDates[0],
				$lte: weekDates[6],
			},
		});

    console.log(weekDates)

    // Filter the activities to only include the activities of today
    const todaysActivities = activities.filter((activity) => {
          const activityDate = new Date(activity.specificDate);
          return activityDate >= todayMidnight && activityDate <= today;
    });

    //Number of all activities today
    const allTodaysActivities = todaysActivities.length;


    const doneTodaysActivities = todaysActivities.filter((activity) => {
		return activity.isDone === true;
    });
    //number of all activities done today
    const doneTodaysActivitiesCount = doneTodaysActivities.length;

    // Filter the activities to only include those within the coming week
    const currentWeekActivities = activities.filter((activity) => {
		const activityDate = new Date(activity.specificDate);
		return activityDate >= weekDates[0] && activityDate <= weekDates[6];
    });
    //Number of all activities of the week
    const allCurrentWeekActivities = currentWeekActivities.length;

    const doneWeekActivities = currentWeekActivities.filter((activity) => {
		return activity.isDone === true;
    });
    //Number of all done activities of the week
    const doneWeekActivitiesCount = doneWeekActivities.length;



//monthly statistics

    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const monthDates = [];

    for (let i = 0; i < lastDayOfMonth.getDate(); i++) {
		const currentDate = new Date(year, month, i + 1);
		monthDates.push(currentDate);
    }

    const monthActivities = await Activity.find({
            userId: userId,
            specificDate: {
                $gte: monthDates[0],
                $lte: monthDates[monthDates.length - 1],
            },
        });

    const allMonthActivities = monthActivities.length;

    const doneMonthActivities = monthActivities.filter((activity) => {
        return activity.isDone === true;
    });

    const doneMonthActivitiesCount = doneMonthActivities.length;





    /* Following block is only for displaying the percentage and a message */

    let todayMessage = "";
    let weekMessage = "";
    let monthMessage = "";
    let percentDone;
    let percentageStringWithPercent;

    if (doneTodaysActivitiesCount / allTodaysActivities < 1) {
		percentDone = (doneTodaysActivitiesCount / allTodaysActivities) * 100;
		percentageStringWithPercent = percentDone.toFixed(0) + '%';
		todayMessage = `${percentageStringWithPercent} -  Keep going!`;
    } else if (doneTodaysActivitiesCount / allTodaysActivities === 1) {
		percentDone = (doneTodaysActivitiesCount / allTodaysActivities) * 100;
		percentageStringWithPercent = percentDone.toFixed(0) + '%';
		todayMessage = `${percentageStringWithPercent} -  You did it!`;
    }

    if (doneWeekActivitiesCount / allCurrentWeekActivities < 1) {
		percentDone = (doneWeekActivitiesCount / allCurrentWeekActivities) * 100;
		percentageStringWithPercent = percentDone.toFixed(0) + '%';
		weekMessage = `${percentageStringWithPercent} -  Keep going!`;
    } else if (doneWeekActivitiesCount / allCurrentWeekActivities === 1) {
		percentDone = (doneWeekActivitiesCount / allCurrentWeekActivities) * 100;
		percentageStringWithPercent = percentDone.toFixed(0) + '%';
		weekMessage = `${percentageStringWithPercent} -  You did it!`;
    }

    if (doneMonthActivitiesCount / allMonthActivities < 1) {
          percentDone = (doneMonthActivitiesCount / allMonthActivities) * 100;
          percentageStringWithPercent = percentDone.toFixed(0) + '%';
          monthMessage = `${percentageStringWithPercent} -  Keep going!`;
    } else if (doneMonthActivitiesCount / allMonthActivities === 1) {
          percentDone = (doneMonthActivitiesCount / allMonthActivities) * 100;
          percentageStringWithPercent = percentDone.toFixed(0) + '%';
          monthMessage = `${percentageStringWithPercent} -  You did it!`;
    }

    // Function that filters the activities by category
      function filterByCategory(activities, categoryToSearch) {
          return activities.filter((activity) => {
              return activity.category === categoryToSearch;
          });
      }


      const allCurrentWeekActivitiesWithWork = filterByCategory(currentWeekActivities, "Work");
      const allCurrentWeekActivitiesWithStudy = filterByCategory(currentWeekActivities, "Studying");
      const allCurrentWeekActivitiesWithExercise = filterByCategory(currentWeekActivities, "Sports");
      const allCurrentWeekActivitiesWithSocial = filterByCategory(currentWeekActivities, "Social Life");
      const allCurrentWeekActivitiesWithOther = filterByCategory(currentWeekActivities, "Other");


      const thisWeekActivitiesWithCategory = {
          work: allCurrentWeekActivitiesWithWork.length,
          study: allCurrentWeekActivitiesWithStudy.length,
          exercise: allCurrentWeekActivitiesWithExercise.length,
          social: allCurrentWeekActivitiesWithSocial.length,
          other: allCurrentWeekActivitiesWithOther.length,
      };

      const allMonthActivitiesWithWork = filterByCategory(monthActivities, "Work");
      const allMonthActivitiesWithStudy = filterByCategory(monthActivities, "Studying");
      const allMonthActivitiesWithExercise = filterByCategory(monthActivities, "Sports");
      const allMonthActivitiesWithSocial = filterByCategory(monthActivities, "Social Life");
      const allMonthActivitiesWithOther = filterByCategory(monthActivities, "Other");

      const thisMonthActivitiesWithCategory = {
          work: allMonthActivitiesWithWork.length,
          study: allMonthActivitiesWithStudy.length,
          exercise: allMonthActivitiesWithExercise.length,
          social: allMonthActivitiesWithSocial.length,
          other: allMonthActivitiesWithOther.length,
      };

      console.log(thisWeekActivitiesWithCategory, thisMonthActivitiesWithCategory);

    const statistic = {
      today: allTodaysActivities,
      doneToday: doneTodaysActivitiesCount,
      week: allCurrentWeekActivities,
      doneWeek: doneWeekActivitiesCount,
      todayMessage: todayMessage,
      weekMessage: weekMessage,
      month: allMonthActivities,
      doneMonth: doneMonthActivitiesCount,
      monthMessage: monthMessage,
      weekCategory: thisWeekActivitiesWithCategory,
      monthCategory: thisMonthActivitiesWithCategory,
    }

    res.render('auth/statistics', { user: req.session.currentUser, monthActivities, statistic: statistic});
	} catch (error) {
		next(error);
	}
});




router.post('/profile/delete-account', isLoggedIn, async (req, res, next) => {
	const { _id } = req.session.currentUser;
	const { password } = req.body;
  const user = req.session.currentUser;

  if (!password) {
    res.render("profile", {
      errorMessage: "Please enter your password to delete your account.", user: req.session.currentUser
    });
    return;
  }

  const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?]).{6,}/;
    if (!regex.test(password)) {
      res.status(500).render("profile", {
        errorMessage:
          "Password needs to have at least 8 characters and must contain at least one special character, one number, one lowercase and one uppercase letter."
      });
      return;}

	try {

  if (bcryptjs.compareSync(password, user.password)) {
    await User.findByIdAndDelete(_id);
		req.session.destroy();
		res.redirect('/');

    } else {
      res.render("profile", {
        errorMessage: "Incorrect password.", user: user
      });
    }


	} catch (error) {
		next(error);
	}
});

router.get('/find-user', (req, res, next) => {
	const loggedOut = 'You are still logged out';
	res.render('auth/find-user', { loggedOut: loggedOut });
});

router.post('/find-user', async (req, res, next) => {
	const loggedOut = 'You are still logged out';

	const { email } = req.body;

	try {
		const findUser = await User.findOne({ email });
		if (!findUser) {
			//user isn't found
			res.render('auth/find-user', {
				errorMessage: 'Email is not registered. Try with other email.',
				loggedOut: loggedOut,
			});
			return;
		} else {
			let message;

			if (findUser.securityQuestion === 'animal') {
				message = 'What is your pets name?';
			} else if (findUser.securityQuestion === 'father') {
				message = "What is your father's last name?";
			} else if (findUser.securityQuestion === 'place') {
				message = 'What is your favorite place in the world?';
			}

			res.render('auth/answer-question', { user: findUser, loggedOut: loggedOut, message: message });
		}
	} catch (error) {
		console.log('Error with POST find-user route', error);
		next(error);
	}
});

router.post('/answer', async (req, res, next) => {
	const loggedOut = 'You are still logged out';
	const { _id, passwordResetAnswer } = req.body;



	try {
		const user = await User.findById(_id);

		if (bcryptjs.compareSync(passwordResetAnswer, user.passwordResetAnswer)) {
			res.render('auth/reset-password', { user: user, loggedOut: loggedOut });
		} else {
			res.render('auth/answer-question', {
				errorMessage: 'Incorrect answer.',
				user: user,
				loggedOut: loggedOut,
			});
		}
	} catch (error) {
		console.log('Error with POST answer route', error);
		next(error);
	}
});

router.post('/reset-password', async (req, res, next) => {
	const loggedOut = 'You are still logged out';
	const { _id, password, confirm, passwordResetAnswer } = req.body;

	if (password === '' || confirm === '' || passwordResetAnswer === '') {
		res.render('auth/reset-password', {
			errorMessage: 'Please enter all fields to reset your password.',
			loggedOut: loggedOut,
		});
		return;
	}

	if (password !== confirm) {
		res.render('auth/reset-password', {
			errorMessage: "Passwords don't match.",
			loggedOut: loggedOut,
		});
		return;
	}
	const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?]).{6,}/;
	if (!regex.test(password)) {
		res.status(500).render('auth/reset-password', {
			errorMessage:
				'Password needs to have at least 8 characters and must contain at least one special character, one number, one lowercase and one uppercase letter.',
			loggedOut: loggedOut,
		});
		return;
	}

	try {
		const salt = await bcryptjs.genSalt(saltRounds);
		//create a Hash from the Salt and the user's password
		const passwordHash = await bcryptjs.hash(password, salt);
		//create a new User in the DB with the Username and the password hash
		const updatePassword = await User.findByIdAndUpdate({ _id }, { password: passwordHash });
		//redirect the new User directly to the login page
		res.redirect('/login');
	} catch (error) {
		next(error);
	}
});


module.exports = router;
