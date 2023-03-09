const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
// Import the middleware for authentication here
const { isLoggedIn } = require('../middleware/routeguard');
const Activity = require('../models/activity');

router.get('/activities/new', (req, res) => {
  res.render('create-activity');
});

router.post('/activities', isLoggedIn, async (req, res) => {
  const { title, description, daysOfWeek, repeat, specificDate } = req.body;

  const activity = new Activity({
    userId: req.user._id, // assuming there is an authenticated user
    title,
    description,
    daysOfWeek,
    repeat,
    specificDate,
  });

  try {const savedActivity = await activity.save();
    res.redirect('/activities/' + savedActivity._id);
  } catch (error) {
    console.log(error);
    res.render('create-activity', { errorMessage: 'Error creating activity.' });
  }
});
  

module.exports = router;