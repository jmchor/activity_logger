const { Schema, model } = require('mongoose');

const activitySchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
		title: {
			type: String,
			required: true
		},
		description: {
			type: String,
			required: true,
		},
		category: {
			type: String,

		},
		isDone: {
			type: Boolean,
			required: true,
			default: false
		},
		daysOfWeek: [
			{
				type: String,
				enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
			},
		],
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
		groupId: {
			type: String,
			required: true,
			default: ''
		}
	},
	{
		// this second object adds extra properties: `createdAt` and `updatedAt`
		timestamps: true,
	}
);

const Activity = model('Activity', activitySchema);

module.exports = Activity;
