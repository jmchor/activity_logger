const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
// Import the middleware for authentication here
const { isLoggedIn } = require('../middleware/routeguard');
const Activity = require('../models/Activity.model');

//Since we display a day's name in the form we need to convert it to a number for the calculation in the POST route
function convertDayOfWeekToNumber(day) {
	switch (day.toLowerCase()) {
		case 'sunday':
			return 0;
		case 'monday':
			return 1;
		case 'tuesday':
			return 2;
		case 'wednesday':
			return 3;
		case 'thursday':
			return 4;
		case 'friday':
			return 5;
		case 'saturday':
			return 6;
		default:
			throw new Error('Invalid day of week: ' + day);
	}
}

router.get('/create', (req, res) => {
	res.render('create-activity');
});

router.post('/create', isLoggedIn, async (req, res, next) => {
	try {
		const { title, description, category, daysOfWeek, repeat, specificDate } = req.body;
		const userId = req.session.currentUser._id;

		// If the activity is a one-time activity, create it and return ==> require the user to click once AND the date
		if (specificDate && repeat === 'once') {
			const newActivity = await Activity.create({
				userId,
				title,
				description,
				category,
				isDone: false,
				daysOfWeek: [],
				repeat: 'once',
				specificDate,
			});
			await newActivity.save();
			return res.redirect('/home');
		}

		// Calculate the number of weeks left in the year ==> limit the number of activities created until end of year
		const now = new Date();
		const endOfYear = new Date(now.getFullYear(), 11, 31);
		const daysLeftInYear = Math.floor((endOfYear - now) / (1000 * 60 * 60 * 24)) + 1;
		const weeksLeftInYear = Math.floor(daysLeftInYear / 7);

		// Create a new activity and repeat it on every weekday for the number of weeks left in the year
		for (let i = 0; i < weeksLeftInYear; i++) {
			//If more than one day is selected for repetition
			if (Array.isArray(daysOfWeek)) {
				for (const day of daysOfWeek) {
					const now = new Date();

					const dayOfWeek = now.getDay();
					const daysUntilNextDayOfWeek =
						(convertDayOfWeekToNumber(day) - dayOfWeek + 7) % 7;
					const date = new Date(
						now.getFullYear(),
						now.getMonth(),
						now.getDate() +
						daysUntilNextDayOfWeek +
						i * 7 +
						(daysUntilNextDayOfWeek < 0 ? 7 : 0),
						now.getHours() + 1
					);
					const newActivity = new Activity({
						userId,
						title,
						description,
						category,
						isDone: false,
						daysOfWeek: [day],
						repeat,
						specificDate: date,
					});
					await newActivity.save();
				}
			} else {
				//if only one day is selected for repetition
				const now = new Date();
				const dayOfWeek = now.getDay();

				const daysUntilNextDayOfWeek =
					(convertDayOfWeekToNumber(daysOfWeek) - dayOfWeek + 7) % 7;

				const date = new Date(
					now.getFullYear(),
					now.getMonth(),
					now.getDate() +
						daysUntilNextDayOfWeek +
						i * 7 +
						(daysUntilNextDayOfWeek < 0 ? 7 : 0),
						now.getHours() + 1
				);

				const newActivity = new Activity({
					userId,
					title,
					description,
					category,
					isDone: false,
					daysOfWeek: [daysOfWeek],
					repeat,
					specificDate: date,
				});
				await newActivity.save();
			}
		}

		console.log('Activity created successfully');
		res.redirect('/home')
	} catch (err) {
		console.error(err);
		res.render('create-activity', { errorMessage: 'Error creating activity.' });
	}
});


router.get('/schedule', async (req, res, next) => {
	// Get the current date and the date of the next week
	const userId = req.session.currentUser._id;
	const currentDate = new Date();
	const nextWeek = new Date();
	nextWeek.setDate(currentDate.getDate() + 7);

	try {
		// Find all activities that have a specific date within the next two weeks
		const activities = await Activity.find({
		  specificDate: {
			userId:userId,
			$gte: currentDate,
			$lte: nextWeek,
		  },
		});

		// Filter the activities to only include those within the coming week
		const comingWeekActivities = activities.filter((activity) => {
		  const activityDate = new Date(activity.specificDate);
		  return activityDate >= currentDate && activityDate < nextWeek;
		});

		// Add hasMonday, hasTuesday, etc. properties to each activity
		comingWeekActivities.forEach((activity) => {
		  const activityDate = new Date(activity.specificDate);
		  const dayOfWeek = activityDate.getDay();

		  activity.hasMonday = (dayOfWeek === 1);
		  activity.hasTuesday = (dayOfWeek === 2);
		  activity.hasWednesday = (dayOfWeek === 3);
		  activity.hasThursday = (dayOfWeek === 4);
		  activity.hasFriday = (dayOfWeek === 5);
		  activity.hasSaturday = (dayOfWeek === 6);
		  activity.hasSunday = (dayOfWeek === 0);
		});

		// Send the coming week activities as the response
		res.render('schedule', { activities: comingWeekActivities });
	  } catch (error) {
		console.error(error);
		next(error)
		res.status(500).send('Server error');
	  }
	});



module.exports = router;
