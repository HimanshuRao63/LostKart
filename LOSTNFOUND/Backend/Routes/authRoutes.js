const express = require("express");
const router = express.Router();
const verifyToken = require('../middleware/token');
const { registerUser, loginUser, getMe } = require("../controllers/authcontroller");

// Public authentication routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected session check (used by Admin Panel & Profile to verify admin role)
router.get("/me", verifyToken, getMe);

module.exports = router;