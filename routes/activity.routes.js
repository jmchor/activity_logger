const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
// Import the middleware for authentication here
const { isLoggedIn } = require('../middleware/routeguard');
const Activity = require('../models/Activity.model');
const methodOverride = require('method-override');
const crypto = require('crypto');
const axios = require('axios');

// middleware to override HTTP methods
router.use(methodOverride('_method'));

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
				const groupString = `${title}${description}${daysOfWeek.join(',')}`;
				const groupId = crypto.createHash('md5').update(groupString).digest('hex');
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
					let daylightSavings = date.getTimezoneOffset();
					if (daylightSavings >= -60) {
						date.setHours(1, 0, 0, 0);
					} else {
						date.setHours(2, 0, 0, 0);
					}
					const newActivity = new Activity({
						userId,
						title,
						description,
						category,
						isDone: false,
						daysOfWeek: [day],
						repeat,
						specificDate: date,
						groupId,
					});
					await newActivity.save();
				}
			} else {
				const groupString = `${title}${description}${daysOfWeek}`;
				const groupId = crypto.createHash('md5').update(groupString).digest('hex');
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
						(daysUntilNextDayOfWeek < 0 ? 7 : 0)
				);
				let daylightSavings = date.getTimezoneOffset();
				if (daylightSavings >= -60) {
					date.setHours(1, 0, 0, 0);
				} else {
					date.setHours(2, 0, 0, 0);
				}

				const newActivity = new Activity({
					userId,
					title,
					description,
					category,
					isDone: false,
					daysOfWeek: [daysOfWeek],
					repeat,
					specificDate: date,
					groupId,
				});
				await newActivity.save();
			}
		}

		console.log('Activity created successfully');
		res.redirect('/home');
	} catch (err) {
		console.error(err);
		res.render('create-activity', { errorMessage: 'Error creating activity.' });
	}
});

router.get('/schedule', async (req, res, next) => {
	const userId = req.session.currentUser._id;
	const { week, lastWeek } = req.query;

	try {

	const now = new Date();
	const testYear = now.getFullYear();
	const jan4th = new Date(testYear, 0, 4, 1);
	const jan4thDay = jan4th.getDay();
	const firstThursday = new Date(testYear, 0, 4 + ((4 - jan4thDay + 7) % 7), 1);
	let weekNumber;



	const today = new Date(new Date().setHours(1, 0, 0, 0));
	let currentDate = new Date();
	let nextWeek;
	let i;
	let flexWeekStart;
	let currentWeekFromView;

	let currentMoment = Math.floor((now - firstThursday) / (7 * 24 * 60 * 60 * 1000)) + 1;

	if (!week && !lastWeek) {
		weekNumber = Math.floor((now - firstThursday) / (7 * 24 * 60 * 60 * 1000)) + 1

		currentDate.setDate(today.getDate());
		let daylightSavings = currentDate.getTimezoneOffset();

		if (daylightSavings === -60) {
			currentDate.setHours(1, 0, 0, 0);
		} else {
			currentDate.setHours(2, 0, 0, 0);
		}

		nextWeek = new Date(
			currentDate.getFullYear(),
			currentDate.getMonth(),
			currentDate.getDate() + (7 - currentDate.getDay())
		);
		nextWeek.setHours(1, 0, 0, 0);
		flexWeekStart = currentDate.getDay() - 1 < 0 ? 6 : currentDate.getDay() - 1;
		currentDate.setDate(currentDate.getDate() - flexWeekStart);

	} else {
		if (week) {
			currentWeekFromView = (Number(week) + 1) % 53;
			weekNumber = currentWeekFromView === 0 ? 1 : currentWeekFromView;

			i = weekNumber - currentMoment;
			currentDate.setDate(today.getDate() + 7 * i);

			let daylightSavings = currentDate.getTimezoneOffset();

			if (daylightSavings === -60) {
				currentDate.setHours(1, 0, 0, 0);
				nextWeek = new Date(
					currentDate.getFullYear(),
					currentDate.getMonth(),
					currentDate.getDate() + (7 - currentDate.getDay())
				);
				nextWeek.setHours(2, 0, 0, 0);
				flexWeekStart = currentDate.getDay() - 1 < 0 ? 6 : currentDate.getDay() - 1;
				currentDate.setDate(currentDate.getDate() - flexWeekStart);

			} else if (daylightSavings === -120) {
				currentDate.setHours(2, 0, 0, 0);
				nextWeek = new Date(
					currentDate.getFullYear(),
					currentDate.getMonth(),
					currentDate.getDate() + (7 - currentDate.getDay())
				);
				flexWeekStart = currentDate.getDay() - 1 < 0 ? 6 : currentDate.getDay() - 1;
				currentDate.setDate(currentDate.getDate() - flexWeekStart);
				nextWeek.setHours(2, 0, 0, 0);

			}
		} else {
			currentWeekFromView = Number(lastWeek) - 1;

			weekNumber = currentWeekFromView === 0 ? 52 : currentWeekFromView;
			i = (weekNumber - currentMoment) * -1;
			currentDate.setDate(today.getDate() - 7 * i);
			let daylightSavings = currentDate.getTimezoneOffset();

			if (daylightSavings === -60) {
				currentDate.setHours(1, 0, 0, 0);
				nextWeek = new Date(
					currentDate.getFullYear(),
					currentDate.getMonth(),
					currentDate.getDate() + (7 - currentDate.getDay())
				);
				nextWeek.setHours(2, 0, 0, 0);
				flexWeekStart = currentDate.getDay() - 1 < 0 ? 6 : currentDate.getDay() - 1;
				currentDate.setDate(currentDate.getDate() - flexWeekStart);

			} else if (daylightSavings === -120) {
				currentDate.setHours(2, 0, 0, 0);
				nextWeek = new Date(
					currentDate.getFullYear(),
					currentDate.getMonth(),
					currentDate.getDate() + (7 - currentDate.getDay())
				);
				nextWeek.setHours(2, 0, 0, 0);
				flexWeekStart = currentDate.getDay() - 1 < 0 ? 6 : currentDate.getDay() - 1;
				currentDate.setDate(currentDate.getDate() - flexWeekStart);

			}
		}
	}


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
	const { _id , update, specificDate } = req.body;
	console.log(req.body);




	try {

		if (update === '+') {

			let date = new Date(specificDate);
			date.setDate(date.getDate() + 1);

			const activity= await Activity.findByIdAndUpdate(_id, { specificDate: date }, { new: true });
			console.log(activity);

		} else {const activity = await Activity.findByIdAndUpdate(_id, { isDone: true }, { new: true });
		console.log(activity);}




	} catch (error) {
		console.error(error);
		next(error);
		res.status(500).send('Server error');
	}
});

router.get('/schedule/:id', isLoggedIn, async (req, res, next) => {
	const { id } = req.params;

	try {
		const findActivity = await Activity.findById(id);
		res.render('edit-activity', { findActivity });
	} catch (error) {
		next(error);
	}
});

router.post('/schedule/:id', isLoggedIn, async (req, res, next) => {
	const { id } = req.params;
	const { title, description, category, daysOfWeek, repeat, specificDate, update } = req.body;

	try {
		const updateActivity = await Activity.findById(id);

		if (update === 'Edit One') {
			await Activity.findByIdAndUpdate(
				id,
				{ title, description, category, daysOfWeek, repeat, specificDate },
				{ new: true }
			);
		} else if (update === 'Edit All') {
			await Activity.updateMany(
				{ groupId: updateActivity.groupId },
				{ title, description, category, daysOfWeek, repeat, specificDate },
				{ new: true }
			);
		} else {
			return res.status(404).send('Activity not found');
		}

		res.redirect('/schedule');
	} catch (error) {
		next(error);
	}
});

router.delete('/schedule/:id', isLoggedIn, async (req, res, next) => {
	const { id } = req.params;
	const { terminate } = req.body;

	try {
		const activityToDelete = await Activity.findById(id);
		console.log(activityToDelete);

		if (!activityToDelete) {
			return res.status(404).send('Activity not found');
		}

		if (terminate === 'Delete Activity') {
			await Activity.findByIdAndDelete(id);
		} else if (terminate === 'Delete Activity and Group') {
			await Activity.deleteMany({ groupId: activityToDelete.groupId });
		} else {
			return res.status(404).send('Activity not found');
		}

		res.redirect('/schedule');
	} catch (error) {
		next(error);
	}
});



module.exports = router;
