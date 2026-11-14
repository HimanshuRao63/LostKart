const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
    itemId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Item', 
        required: true 
    },
    claimantId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    // The 5 Verification Fields
    brand: { 
        type: String, 
        default: '' 
    },
    uniqueMarks: { 
        type: String, 
        required: true 
    },
    distinctiveFeature: { 
        type: String, 
        required: true 
    },
    contentInside: { 
        type: String, 
        default: '' 
    },
    additionalInfo: { 
        type: String, 
        default: '' 
    },
    proofImageUrl: { 
        type: String, 
        default: '' 
    },
    status: { 
        type: String, 
        enum: ['pending', 'verified', 'rejected'], 
        default: 'pending' 
    },
    adminNotes: { 
        type: String, 
        default: '' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Claim', claimSchema);