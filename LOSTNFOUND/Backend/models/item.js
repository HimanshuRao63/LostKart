const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['lost', 'found'],
        required: true
    },
    itemName: { 
        type: String,
        default: 'Reported Item'
    },
    date: {
        type: Date
    },
    location: {
        type: String,
        required: true
    },
    category: {
        type: String,
        default: 'other'
    },
    colour: { 
        type: String 
    },
    time: { 
        type: String 
    }, 
    description: {
        type: String,
        default: ''
    },
    imagePath: {
        type: String
    },
    // Required moderation & visibility flags
    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'claimed'],
        default: 'pending'
    },
    showImage: {
        type: Boolean,
        default: true // true = display uploaded photo, false = display default placeholder
    },
    isVisible: {
        type: Boolean,
        default: false
    },
    rejectionReason: {
        type: String,
        default: ''
    },
    secretIdentifier: {
        type: String
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);