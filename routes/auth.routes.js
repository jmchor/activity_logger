const express = require('express');
const router = express.Router();
const User = require('../models/User.model');
const mongoose = require('mongoose');

const bcryptjs = require('bcryptjs')
const saltRounds = 10


//require middleware here

//user screen (you get here when calling '/user')

router.get('/', async (req, res, next) => {
        res.render('index-logged-out');
});



router.get('/signup', (req, res, next) => {
        res.render('auth/sign-up');
});




router.post('/signup', async( req, res, next ) => {

        const { username, password, confirm } = req.body

        //make sure the user provides both required inputs
        if(!username || !password || !confirm) {
                res.render('auth/sign-up', {errorMessage: "All fields are mandatory. Please provide username and password."})
        }
        //password and confirmation need to match
        if ( password !== confirm) {
                res.render('auth/sign-up', {errorMessage: "Passwords do not match"})

        }

        //TODO include regex here to make password restrictive?

        try {
                //create Salt
                const salt = await bcryptjs.genSalt(saltRounds)
                //create a Hash from the Salt and the user's password
                const passwordHash = await bcryptjs.hash(password, salt)
                //create a new User in the DB with the Username and the password hash
                const newUser = await User.create({username, password: passwordHash})
                //redirect the new User directly to the login page
                res.redirect('/login')


        } catch (error) {
                if (error instanceof mongoose.Error.ValidationError) {
                        res.status(500).render('auth/sign-up', { errorMessage: error.message });
                } else if (error.code === 11000) {
                        res.status(500).render('auth/sign-up', {
                                errorMessage:
                                        'The username needs to be unique. Username already in use.',
                        });
                } else {
                        next(error);
                }

        }

})

router.get('/login', (req, res, next) => {
	res.render('auth/login');
});


router.post('/login', async (req, res, next) => {
	const { username, password } = req.body;

	if (username === '' || password === '') {
		res.render('auth/login', {
			errorMessage: 'Please enter both username and password to log in.',
		});
		return;
	}

	try {
		const user = await User.findOne({ username });
		res.redirect('/index-logged-in');
	} catch (error) {
		next(error);
	}
});



module.exports = router;
