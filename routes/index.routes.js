const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
	res.render('index', { layout: 'loggedout-layout' });
});

module.exports = router;