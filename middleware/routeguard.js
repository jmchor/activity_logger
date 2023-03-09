const isLoggedIn = (req, res, next) => {
	req.session.currentUser ? next() : res.redirect('/login');
};

module.exports = {
	isLoggedIn
};
