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
          repeats: {
            type: String,
            enum: ['weekly', 'specific'],
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
