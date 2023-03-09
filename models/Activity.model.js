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
    days: {
      type: [
        {
          dayOfWeek: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            required: true,
          },
          //add daily  and none options to the enum to be more precise, since weekly usually means once a week, and specific uses a specific Date object
          repeats: {
            type: String,
            enum: ['none','daily', 'weekly', 'specific'],
            required: true,
          },
          //the required function means that only if the "specific" option in "repeats" was selected a date input will be required?
          date: {
            type: Date,
            required: function () {
              return this.repeats === 'specific';
            },
          },
        },
      ],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Activity = model("Activity", activitySchema);

module.exports = Activity;
