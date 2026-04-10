const express = require("express");
const { getCategoryProblems } = require("../controllers/leetcodeController");

const router = express.Router();

router.get("/category/:slug", getCategoryProblems);

module.exports = router;
