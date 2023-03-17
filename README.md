# TaskTastrophe - Don't let your tasks become a desaster

## Project Description

TaskTastrophe is an app to help you plan recurring activities for every week or just a single task.

With a calendar view on the weeks tasks, organize what you want to do. Build habits using this app - and learn a thing or two!

### Basic Functionalities

- Create a user with password and email authentication, security question and answer
- Create a task with a title, a description - chose between a recurrence (on one or multiple weekdays for the remainder of the year) or a task that only happens once
- mark a task as done
- View the weeks schedule which displays all of the current weeks tasks
- View the weeks after or before the current week
- See today's tasks on the home screen
- View a task in detail
- Edit one task or all recurrences of this task
- Delete one or all recurrences of this task

### Advanced Functionalities

- Procrastinate: postpone any given task by a day!
- Learn something new with the Random Fact API on the home screen!
- Forgot your password? Answer a security question and create a new one?
- Want to stay logged in? Don't forget to "Remember me"!
- Don't want to use the app anymore? Go ahead and delete your profile!

### Backlog

- Statistics page for User Profile

---

## Technologies

This project uses Node.js, Express and MongoDB

Most important middleware functions and packages include:

- bcryptjs
- express-session
- connect-mongo
- crypto
- axios
- hbs
- authentication middleware function (to discern logged-in/out states)

Base structure organization using [Ironlauncher](https://www.npmjs.com/package/ironlauncher) generator by Ironhack.

## Installation

After cloning the repository

```bash
git clone https://github.com/jmchor/activity_logger.git
```

install all dependencies with

```bash
npm install
```

Create a .env file specifying PORT number as well as a SESS_SECRET. If you want to use the random facts API, create a free account and save the FACT_API_KEY as an environment variable as well.

Run the app on a local machine using

```bash
npm run dev
```

or use

```bash
nodemon
```

in the projects root directory (nodemon needs to be installed as well)

---

## Project Structure

### Routes

#### Index

- GET /

#### Auth Routes

- GET /signup
     - renders sign-up form
- POST /signup
     - creates the user according to the User model
- GET /login
     - renders login form
- POST /login
     - finds a user, compares passwords and redirects to /home
- GET /home
     - renders the home page
- GET /profile

     - renders the profile page

- POST /logout
     - Deletes the session cookie and redirects to /login
- POST /profile/delete-account
     - compares user password and deletes the user

#### Activity Route

- GET /create
     - renders the create-activity form
- POST /create
     - creates a new activity and redirects to /home
- GET /schedule
     - renders the weekly schedule with objects containing activity and date data
- POST /schedule
     - finds an activity and sets the isDone property to "true"
- GET /schedule/:id
     - renders activity detail view and form
- POST /schedule/:id
     - Edits an activity according to the input data
- DELETE /schedule/:id
     - deletes an activity after password comparison

### Models

#### User

```javascript
username: {
      type: String,
      trim: true,
      required: false,
      unique: true
    },
    email: {
      type: String,
      required: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address."],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    activities: [
      {
      type: Schema.Types.ObjectId,
      ref:"Activity"
    }]
```

#### Activity

```javascript
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
  isDone: {
   type: Boolean,
   required: true,
   default: false,
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
   default: '',
  }
```

---

## Contributors

This project was realized by [Johannes Chorzempa](https://github.com/jmchor), [Nana Chuto](https://github.com/nncht) & [Lukas Jürgens](https://github.com/lukasmerlin) for the second module of Ironhack Bootcamp.
