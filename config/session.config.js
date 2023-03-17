const session = require("express-session");
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose')

module.exports = (app) => {

	app.use(
		session({
			secret: process.env.SESS_SECRET,
			resave: true,
			saveUninitialized: false,
			cookie: {
				httpOnly: true,
				maxAge: 30 * 60 * 1000, // default 30 Minutes
			},
			store: MongoStore.create({
				mongoUrl: process.env.MONGODB_URI || 'mongodb://127.0.0.1/activity-logger',
			}),
		})
	);
};
