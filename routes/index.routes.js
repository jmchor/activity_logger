const express = require("express");
const router = express.Router();

router.get("/", (req, res, next) => {
  const loggedOut = "You are still logged out";
  res.render("index", { loggedOut: loggedOut });
});

module.exports = router;
