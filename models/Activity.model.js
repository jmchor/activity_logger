const { Schema, model } = require("mongoose");

const activitySchema = new Schema(
	{
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		date: {
			isMonday: {
				type: Boolean,
				default: false,
				required: true,
			},
			isTuesday: {
				type: Boolean,
				default: false,
				required: true,
			},
			isWednesday: {
				type: Boolean,
				default: false,
				required: true,
			},
			isThursday: {
				type: Boolean,
				default: false,
				required: true,
			},
			isFriday: {
				type: Boolean,
				default: false,
				required: true,
			},
			isSaturday: {
				type: Boolean,
				default: false,
				required: true,
			},
			isSunday: {
				type: Boolean,
				default: false,
				required: true,
			},
		},
	},
	{
		timestamps: true,
	}
);