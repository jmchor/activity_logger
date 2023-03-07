const express = require('express');
const router = express.Router();
const User = require('../models/User.model')
const mongoose = require('mongoose')

//password stuff here

//require middleware here

// login GET route here

router.get('/login', (req, res, next) => {
    res.render('auth/login')
})




//login POST route here



module.exports = router;
