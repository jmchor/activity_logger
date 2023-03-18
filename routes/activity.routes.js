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
		if (specificDate) {
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
						now.getHours()
						//  +1 for development here
					);
					date.setHours(0, 0, 0, 0);
					// let daylightSavings = date.getTimezoneOffset();
					// if (daylightSavings >= -60) {
					// 	date.setHours(1, 0, 0, 0);
					// } else {
					// 	date.setHours(2, 0, 0, 0);
					// }
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
					console.log(newActivity)
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
				date.setHours(0, 0, 0, 0);

				// let daylightSavings = date.getTimezoneOffset();
				// if (daylightSavings >= -60) {
				// 	date.setHours(1, 0, 0, 0);
				// } else {
				// 	date.setHours(2, 0, 0, 0);
				// }

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
				console.log(newActivity)
			}

		}




		console.log('Activity created successfully');
		res.redirect('/home');
	} catch (err) {
		console.error(err);
		res.render('create-activity', { errorMessage: 'Error creating activity.' });
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

	console.log(specificDate)

	try {
		const updateActivity = await Activity.findById(id);

		if (specificDate) {

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
		} else if (update === 'Procrastinate') {

			console.log("specificDate", specificDate)

			let date = new Date(specificDate);
			date.setDate(date.getDate() + 1);

			await Activity.findByIdAndUpdate(
				id,
				{specificDate: date },
				{ new: true })
		}

		else {
			return res.status(404).send('Activity not found');
		}
		res.redirect('/schedule');
	}
		else {
			if (update === 'Edit One') {
				await Activity.findByIdAndUpdate(
					id,
					{ title, description, category, daysOfWeek, repeat },
					{ new: true }
				);
			} else if (update === 'Edit All') {
				await Activity.updateMany(
					{ groupId: updateActivity.groupId },
					{ title, description, category, daysOfWeek, repeat },
					{ new: true }
				);
			}

		res.redirect('/schedule');}
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
