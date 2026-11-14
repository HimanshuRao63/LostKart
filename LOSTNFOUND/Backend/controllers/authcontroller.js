const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Keep this identical to the front-end check and the Mongoose schema validator.
// 8–64 chars, ≥1 lowercase, ≥1 uppercase, ≥1 digit, ≥1 special char, no spaces.
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,64}$/;

exports.registerUser = async (req, res) => {
    try {
        const { name, rollNo, phone, email, password, course } = req.body;

        // ---------- REQUIRED FIELD CHECK ----------
        if (!name || !rollNo || !phone || !email || !password) {
            return res.status(400).json({
                message: "Name, roll number, phone, email and password are required."
            });
        }

        // ---------- PASSWORD STRENGTH CHECK (before hashing!) ----------
        if (typeof password !== "string" || !PASSWORD_REGEX.test(password)) {
            return res.status(400).json({
                message:
                    "Password must be 8–64 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character (no spaces)."
            });
        }

        // ---------- DUPLICATE EMAIL CHECK ----------
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // ---------- HASH & SAVE ----------
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            rollNo,
            phone,
            email,
            password: hashedPassword,
            course: (course || '').trim()
        });

        await user.save();

        res.status(201).json({ message: "User registered successfully" });

    } catch (error) {
        console.error("REGISTER ERROR:", error);

        // Mongo duplicate key (email or rollNo)
        if (error.code === 11000) {
            return res.status(400).json({
                message: "This email or roll number is already registered."
            });
        }

        // Mongoose schema validation error (e.g. password rule caught again)
        if (error.name === "ValidationError") {
            const first = Object.values(error.errors)[0];
            return res.status(400).json({
                message: first ? first.message : "Invalid data provided."
            });
        }

        res.status(500).json({ message: "Registration failed. Please try again." });
    }
};


// ---------- LOGIN (unchanged) ----------
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // --- Check if the account is banned ---
        if (user.isBlocked) {
            return res.status(403).json({
                message: `Account is blocked. Reason: ${user.blockReason || 'Terms violation'}`
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // --- INCLUDE ROLE IN TOKEN PAYLOAD ---
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                rollNo: user.rollNo,
                course: user.course,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ---------- GET ME (unchanged) ----------
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};