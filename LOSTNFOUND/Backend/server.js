const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// Initialize dotenv
dotenv.config({ path: __dirname + "/.env" });

// Import your DB, Middleware, Models, and Routes
const connectDB = require("./DB/db");
const verifyToken = require("./middleware/token");
const User = require("./models/user");
const authRoutes = require("./Routes/authRoutes");
const itemRoutes = require("./Routes/itemRoutes");
const adminRoutes = require("./Routes/adminRoutes");

const app = express();

// ==========================================
// 1. MIDDLEWARE (CRITICAL FOR FILE UPLOADS)
// ==========================================
const allowedOrigins = [
    'http://localhost:5500', 'http://127.0.0.1:5500',
    'http://localhost:3000', 'http://127.0.0.1:3000',
    'http://localhost:3002', 'http://127.0.0.1:3002',
    'http://localhost:5173', 'http://127.0.0.1:5173',
    'http://localhost:5000', 'https://lostkart.onrender.com',
    'https://yourdomain.com'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (file://, curl, mobile apps)
        if (!origin) return callback(null, true);

        // 1. Check if it's in the allowed list (localhost, render)
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }

        // 2. Allow any Vercel deployment (both preview and production)
        if (origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }

        console.warn('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Explicitly allow methods
    allowedHeaders: ['Content-Type', 'Authorization'] // Explicitly allow headers
}));// Allows frontend to talk to backend
// Handle preflight requests for all routes
app.options('/*splat', cors());
app.use(express.json()); // Allows server to read JSON
app.use(express.urlencoded({ extended: true })); // Allows server to read FormData (images)

// ==========================================
// 2. CONNECT TO MONGODB
// ==========================================
connectDB();

// Helper to resolve User ID from token or request body/query
// function resolveUserId(req) {
//     const authHeader = req.headers["authorization"];
//     const token = authHeader && authHeader.split(" ")[1];

//     if (token && token !== "null" && token !== "undefined") {
//         try {
//             const decoded = jwt.verify(token, process.env.JWT_SECRET);
//             return decoded.id || decoded._id || decoded.userId;
//         } catch (err) {
//             // Fall through to body/query lookup if token check fails
//         }
//     }

//     return (
//         (req.body && (req.body.userId || req.body._id || req.body.id)) ||
//         (req.query && (req.query.userId || req.query._id || req.query.id)) ||
//         null
//     );
// }

// ==========================================
// 3. ATTACH YOUR ROUTES
// ==========================================
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/admin", adminRoutes);


// Verify JWT token on every page load
app.get("/api/auth/verify", verifyToken, (req, res) => {
    res.status(200).json({ valid: true, user: req.user });
});


// ==========================================
// 4. USER PROFILE ROUTES (GET & UPDATE)
// ==========================================

// GET current logged-in user's profile
app.get("/api/user/profile", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password").lean();
        if (!user) return res.status(404).json({ message: "User not found." });
        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ message: "Server error while fetching profile." });
    }
});

// PUT update current logged-in user's profile (requires login)
app.put("/api/user/profile", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;   // ✅ ONLY from verified JWT
        const { email, mobile, name, rollno } = req.body;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(401).json({ message: "Invalid session. Please log in." });
        }

        const existingUser = await User.findById(userId).lean();
        if (!existingUser) {
            return res.status(404).json({ message: "User account not found." });
        }

        const updateFields = {};
        if (email) updateFields.email = email.trim();
        if (mobile) updateFields.mobile = mobile.trim();
        if (mobile) updateFields.phone = mobile.trim();
        if (name) updateFields.name = name.trim();
        if (rollno) updateFields.rollno = rollno.trim();
        if (rollno) updateFields.rollNo = rollno.trim();
        // if (course)   updateFields.course   = course.trim();

        await User.collection.updateOne(
            { _id: existingUser._id },
            { $set: updateFields }
        );

        const updatedUser = await User.findById(existingUser._id).select("-password").lean();

        res.status(200).json({
            message: "Profile updated successfully.",
            user: updatedUser
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        if (error.code === 11000) {
            return res.status(400).json({ message: "This email is already in use." });
        }
        res.status(500).json({ message: error.message || "Failed to update profile." });
    }
});

// ==========================================
// 5. USER DASHBOARD REPORTS ROUTE
// ==========================================
app.get("/api/user/reports", verifyToken, async (req, res) => {
    try {
        const ItemModel =
            mongoose.models.Item ||
            mongoose.models.item ||
            Object.values(mongoose.models).find(m => m.modelName.toLowerCase().includes("item"));

        if (!ItemModel) {
            return res.status(500).json({ message: "Item model not found." });
        }

        const userId = String(req.user.id || req.user._id || req.user.userId);
        const allItems = await ItemModel.find().sort({ createdAt: -1 }).lean();

        const userReports = allItems.filter(item => {
            const ownerId =
                item.user ||
                item.userId ||
                item.reportedBy ||
                item.postedBy ||
                item.createdBy;
            return ownerId && String(ownerId._id || ownerId) === userId;
        });

        res.status(200).json(userReports);
    } catch (error) {
        console.error("Dashboard fetch error:", error);
        res.status(500).json({ error: "Failed to retrieve your reports." });
    }
});

// Base test route
app.get("/", function (req, res) {
    res.send("Server is running!");
});

// ==========================================
// 6. START SERVER ON PORT 5000
// ==========================================
const PORT = process.env.PORT || 5000;

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
    console.error("[SERVER ERROR]", err.stack || err.message);
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({
        message: process.env.NODE_ENV === 'production'
            ? 'Something went wrong.'
            : (err.message || 'Internal server error.')
    });
});

// 404 handler for any unmatched /api route
app.use('/api', (req, res) => {
    res.status(404).json({ message: `API route not found: ${req.method} ${req.originalUrl}` });
});


app.listen(PORT, function () {
    console.log(`Backend Server is running on port ${PORT}`);
});
