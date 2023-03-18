const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
// Import the middleware for authentication here
const { isLoggedIn } = require('../middleware/routeguard');
const Activity = require('../models/Activity.model');
const methodOverride = require('method-override');
const crypto = require('crypto');
const axios = require('axios');
const { isDate } = require('util/types');

// middleware to override HTTP methods
router.use(methodOverride('_method'));

router.get('/schedule', isLoggedIn, async (req, res, next) => {
	const userId = req.session.currentUser._id;
	const { week, lastWeek } = req.query;

	try {

	const now = new Date();
	const testYear = now.getFullYear();
	const jan4th = new Date(testYear, 0, 4, 1);
	const jan4thDay = jan4th.getDay();
	const firstThursday = new Date(testYear, 0, 4 + ((4 - jan4thDay + 7) % 7), 1);
	let weekNumber;



	const today = new Date(new Date().setHours(0, 0, 0, 0));
	let currentDate = new Date();
	let nextWeek;
	let i;
	let flexWeekStart;
	let currentWeekFromView;

	let currentMoment = Math.floor((now - firstThursday) / (7 * 24 * 60 * 60 * 1000)) + 1;

	if (!week && !lastWeek) {
		weekNumber = Math.floor((now - firstThursday) / (7 * 24 * 60 * 60 * 1000)) + 1

		currentDate.setDate(today.getDate());
		// let daylightSavings = currentDate.getTimezoneOffset();

		// if (daylightSavings === -60) {
		// 	currentDate.setHours(1, 0, 0, 0);
		// } else {
		// 	currentDate.setHours(2, 0, 0, 0);
		// }

		nextWeek = new Date(
			currentDate.getFullYear(),
			currentDate.getMonth(),
			currentDate.getDate() + (7 - currentDate.getDay())
		);
		// nextWeek.setHours(1, 0, 0, 0);
		flexWeekStart = currentDate.getDay() - 1 < 0 ? 6 : currentDate.getDay() - 1;
		currentDate.setDate(currentDate.getDate() - flexWeekStart);
        console.log('currentDate', currentDate, 'nextWeek', nextWeek)
	} else {
		if (week) {
			currentWeekFromView = (Number(week) + 1) % 53;
			weekNumber = currentWeekFromView === 0 ? 1 : currentWeekFromView;

			i = weekNumber - currentMoment;
			currentDate.setDate(today.getDate() + 7 * i);

			// let daylightSavings = currentDate.getTimezoneOffset();

			// if (daylightSavings === -60) {
			// 	currentDate.setHours(1, 0, 0, 0);
			// 	nextWeek = new Date(
			// 		currentDate.getFullYear(),
			// 		currentDate.getMonth(),
			// 		currentDate.getDate() + (7 - currentDate.getDay())
			// 	);
			// 	nextWeek.setHours(2, 0, 0, 0);
			// 	flexWeekStart = currentDate.getDay() - 1 < 0 ? 6 : currentDate.getDay() - 1;
			// 	currentDate.setDate(currentDate.getDate() - flexWeekStart);

			// } else if (daylightSavings === -120) {
			// 	currentDate.setHours(2, 0, 0, 0);
			// 	nextWeek = new Date(
			// 		currentDate.getFullYear(),
			// 		currentDate.getMonth(),
			// 		currentDate.getDate() + (7 - currentDate.getDay())
			// 	);
				flexWeekStart = currentDate.getDay() - 1 < 0 ? 6 : currentDate.getDay() - 1;
				currentDate.setDate(currentDate.getDate() - flexWeekStart);
				// nextWeek.setHours(2, 0, 0, 0);
                console.log('currentDate', currentDate, 'nextWeek', nextWeek)
			// }
		} else {
			currentWeekFromView = Number(lastWeek) - 1;

			weekNumber = currentWeekFromView === 0 ? 52 : currentWeekFromView;
			i = (weekNumber - currentMoment) * -1;
			currentDate.setDate(today.getDate() - 7 * i);
			let daylightSavings = currentDate.getTimezoneOffset();

			// if (daylightSavings === -60) {
			// 	currentDate.setHours(1, 0, 0, 0);
			// 	nextWeek = new Date(
			// 		currentDate.getFullYear(),
			// 		currentDate.getMonth(),
			// 		currentDate.getDate() + (7 - currentDate.getDay())
			// 	);
			// 	nextWeek.setHours(2, 0, 0, 0);
			// 	flexWeekStart = currentDate.getDay() - 1 < 0 ? 6 : currentDate.getDay() - 1;
			// 	currentDate.setDate(currentDate.getDate() - flexWeekStart);

			// } else if (daylightSavings === -120) {
			// 	currentDate.setHours(2, 0, 0, 0);
			// 	nextWeek = new Date(
			// 		currentDate.getFullYear(),
			// 		currentDate.getMonth(),
			// 		currentDate.getDate() + (7 - currentDate.getDay())
			// 	);
			// 	nextWeek.setHours(2, 0, 0, 0);
				flexWeekStart = currentDate.getDay() - 1 < 0 ? 6 : currentDate.getDay() - 1;
				currentDate.setDate(currentDate.getDate() - flexWeekStart);

                console.log('currentDate', currentDate, 'nextWeek', nextWeek)
			// }
		}
	}
    console.log('Activity finding for', currentDate, 'and', nextWeek)

		// Find all activities that have a specific date within the next two weeks
		const activities = await Activity.find({
			userId: userId,
			specificDate: {
				$gte: currentDate,
				$lte: nextWeek,
			},
		});

		// Filter the activities to only include those within the coming week
		const comingWeekActivities = activities.filter((activity) => {
			const activityDate = new Date(activity.specificDate);
			return activityDate >= currentDate && activityDate <= nextWeek;
		});

		let noMonday = true;
		let noTuesday = true;
		let noWednesday = true;
		let noThursday = true;
		let noFriday = true;
		let noSaturday = true;
		let noSunday = true;

		const noActivities = {
			Monday: noMonday,
			Tuesday: noTuesday,
			Wednesday: noWednesday,
			Thursday: noThursday,
			Friday: noFriday,
			Saturday: noSaturday,
			Sunday: noSunday
		  };


		// Add hasMonday, hasTuesday, etc. properties to each activity
		comingWeekActivities.forEach((activity) => {
			const activityDate = new Date(activity.specificDate);
			const dayOfWeek = activityDate.getDay();

			activity.hasMonday = dayOfWeek === 1;
			activity.hasTuesday = dayOfWeek === 2;
			activity.hasWednesday = dayOfWeek === 3;
			activity.hasThursday = dayOfWeek === 4;
			activity.hasFriday = dayOfWeek === 5;
			activity.hasSaturday = dayOfWeek === 6;
			activity.hasSunday = dayOfWeek === 0;

			activity.hasMonday ? noActivities.Monday = false : 0;
			activity.hasTuesday ? noActivities.Tuesday = false : 0;
			activity.hasWednesday ? noActivities.Wednesday = false : 0;
			activity.hasThursday ? noActivities.Thursday = false : 0;
			activity.hasFriday ? noActivities.Friday = false : 0;
			activity.hasSaturday ? noActivities.Saturday = false : 0;
			activity.hasSunday ? noActivities.Sunday = false : 0;

		});

		const year = currentDate.getFullYear();
		const scheduleDate = new Date(year, 0, 1);
		scheduleDate.setDate(scheduleDate.getDate() + (weekNumber - 1) * 7 - scheduleDate.getDay() + 1);
		let daylightSavings = scheduleDate.getTimezoneOffset();

		if (daylightSavings === -60) {
			scheduleDate.setHours(1, 0, 0, 0);
		} else if (daylightSavings === -120) {
			scheduleDate.setHours(2, 0, 0, 0);
		}

		let mondayDate = new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), scheduleDate.getDate(), scheduleDate.getHours());
		let tuesdayDate = new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), scheduleDate.getDate() + 1, scheduleDate.getHours());
		let wednesdayDate = new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), scheduleDate.getDate() + 2, scheduleDate.getHours());
		let thursdayDate = new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), scheduleDate.getDate() + 3, scheduleDate.getHours());
		let fridayDate = new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), scheduleDate.getDate() + 4, scheduleDate.getHours());
		let saturdayDate = new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), scheduleDate.getDate() + 5, scheduleDate.getHours());
		let sundayDate = new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), scheduleDate.getDate() + 6, scheduleDate.getHours());



		let weekDates = {
			Monday: `${mondayDate.getDate() < 10 ? '0' : ''}${mondayDate.getDate()}.${mondayDate.getMonth() + 1 < 10 ? '0' : ''}${mondayDate.getMonth() + 1}.${mondayDate.getFullYear()}`,
			Tuesday: `${tuesdayDate.getDate() < 10 ? '0' : ''}${tuesdayDate.getDate()}.${tuesdayDate.getMonth() + 1 < 10 ? '0' : ''}${tuesdayDate.getMonth() + 1}.${tuesdayDate.getFullYear()}`,
			Wednesday: `${wednesdayDate.getDate() < 10 ? '0' : ''}${wednesdayDate.getDate()}.${wednesdayDate.getMonth() + 1 < 10 ? '0' : ''}${wednesdayDate.getMonth() + 1}.${wednesdayDate.getFullYear()}`,
			Thursday: `${thursdayDate.getDate() < 10 ? '0' : ''}${thursdayDate.getDate()}.${thursdayDate.getMonth() + 1 < 10 ? '0' : ''}${thursdayDate.getMonth() + 1}.${thursdayDate.getFullYear()}`,
			Friday: `${fridayDate.getDate() < 10 ? '0' : ''}${fridayDate.getDate()}.${fridayDate.getMonth() + 1 < 10 ? '0' : ''}${fridayDate.getMonth() + 1}.${fridayDate.getFullYear()}`,
			Saturday: `${saturdayDate.getDate() < 10 ? '0' : ''}${saturdayDate.getDate()}.${saturdayDate.getMonth() + 1 < 10 ? '0' : ''}${saturdayDate.getMonth() + 1}.${saturdayDate.getFullYear()}`,
			Sunday: `${sundayDate.getDate() < 10 ? '0' : ''}${sundayDate.getDate()}.${sundayDate.getMonth() + 1 < 10 ? '0' : ''}${sundayDate.getMonth() + 1}.${sundayDate.getFullYear()}`,

		  };

		  const response = await axios.get('https://api.api-ninjas.com/v1/facts?limit=1', {
		headers: {
			'X-Api-Key': process.env.FACT_API_KEY,
		},
    });
    const data = await response.data;
    const fact = data[0].fact;





		// Send the coming week activities as the response
		res.render('schedule', { activities: comingWeekActivities, week: weekNumber, weekDates, fact:fact,  noActivities: noActivities  });
	} catch (error) {
		console.error(error);
		next(error);
		res.status(500).send('Server error');
	}
});

router.post('/schedule', isLoggedIn, async (req, res, next) => {
	const { _id } = req.body;

	try {
		const activity = await Activity.findByIdAndUpdate(_id, { isDone: true }, { new: true });
		console.log(activity);
	} catch (error) {
		console.error(error);
		next(error);
		res.status(500).send('Server error');
	}
});

module.exports = router;