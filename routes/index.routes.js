const express = require("express");
const router = express.Router();

router.get("/", (req, res, next) => {
  if (req.session.currentUser) {
    // user is logged in, redirect to home page
    return res.redirect("/home");
  } else {
    const loggedOut = "You are still logged out";

    const slogans = [
      "Dive into productivity with our task management app",
      "Keep your producitvity afloat with our task management app",
      "Save time like a pro swimmer with our task management app",
      "Surf through your tasks with our Taskmeister productivity app",
      "Don’t let your productivity sink - use Taskmeister",
      "Swim through your tasks with ease using Taskmeister",
      "The lifesaver for your productivity needs",
      "Let Taskmeister keep you on track and above water",
    ];

    const randomSlogan = slogans[Math.floor(Math.random() * slogans.length)];

    res.render("index", { loggedOut: loggedOut, slogan: randomSlogan });
  }
});

module.exports = router;
