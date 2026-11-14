const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    rollNo: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    course: {
        type: String,
        default: ''
    },
    password: {
        type: String,
        required: true,
        minlength: [8, "Password must be at least 8 characters long."],
        maxlength: [64, "Password must not exceed 64 characters."],
        validate: {
            validator: function (v) {
                // At least one lowercase, one uppercase, one digit, one special char, no whitespace
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,64}$/.test(v);
            },
            message:
                "Password must be 8–64 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character (no spaces)."
        }
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    blockReason: {
        type: String,
        default: ''
    }
},
    { timestamps: true });

module.exports = mongoose.model("User", userSchema);