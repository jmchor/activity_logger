const express = require("express");
const router = express.Router();

router.get("/", (req, res, next) => {

  if (req.session.currentUser) {
    // user is logged in, redirect to home page
    return res.redirect("/home");
  } else {
    const loggedOut = "You are still logged out";
    res.render("index", { loggedOut: loggedOut });
  }
});

module.exports = router;
