const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
// Import the middleware for authentication here
const { isLoggedIn } = require('../middleware/routeguard');




module.exports = router;