const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
	res.render('index-logged-out', { layout: 'layout' });
});

module.exports = router;