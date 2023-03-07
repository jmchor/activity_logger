const express = require('express');
const router = express.Router();
const User = require('../models/User.model')
const mongoose = require('mongoose')

//password stuff here

//require middleware here

// login GET route here

router.get('/login', (req, res, next) => {
    res.render('auth/index-logged-out')
})


//login POST route here


router.post('/login', async (req,res,next) => {
    const { username, password, email} = req.body

    if (username === '' || password === '') {
        res.render('auth/login', {
                errorMessage: 'Please enter both email and password to log in.',
        });
        return;
}

try {
        const user = await User.findOne({ username });
        res.redirect('/index-logged-in')

} catch (error) {
        next(error);
}
});

module.exports = router;
