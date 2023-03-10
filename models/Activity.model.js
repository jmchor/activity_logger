const { Schema, model } = require('mongoose');


//compartmentalize the days of the week into their own Schema
const daySchema = new Schema(
	{
		day: {
			type: String,
			enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
			required: true,
		},
		isDone: {
			type: Boolean,
			required: true,
			default: false,
		},
	},
	{
		_id: false,
	}
);

const activitySchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		category: {
			type: String,
		},
		daysOfWeek: {
			type: [daySchema],
			required: true,
			//check that the user actually puts in a day
			validate: [
				(days) => days.length > 0 && days.length <= 7,
				'daysOfWeek must contain between 1 and 7 days',
			],
		},
		repeat: {
			type: String,
			enum: ['weekly', 'once'],
			default: 'once',
		},
		specificDate: {
			type: Date,
			required: function () {
				return this.repeat === 'once';
			},
		},
	},
	{
		// this second object adds extra properties: `createdAt` and `updatedAt`
		timestamps: true,
	}
);

const Activity = model('Activity', activitySchema);

module.exports = Activity;
