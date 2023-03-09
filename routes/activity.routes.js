const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
// Import the middleware for authentication here
const { isLoggedIn } = require('../middleware/routeguard');
const Activity = require('../models/Activity.model')

router.get('/create', (req, res) => {
	res.render('create-activity');
});

router.post('/create', isLoggedIn, async (req, res) => {
	const { title, description, daysOfWeek, repeat, specificDate } = req.body;

	const activity = Activity.create({
		userId: req.session.currentUser._id, // assuming there is an authenticated user
		title,
		description,
		daysOfWeek,
		repeat,
		specificDate,
	});

	try {
        //TODO write hbs view to see all views or weekly view
		// const savedActivity = await activity.save();
		// res.redirect('/create/' + savedActivity._id);
        res.redirect('/home')
	} catch (error) {
		console.log(error);
		res.render('create-activity', { errorMessage: 'Error creating activity.' });
	}
});

module.exports = router;
