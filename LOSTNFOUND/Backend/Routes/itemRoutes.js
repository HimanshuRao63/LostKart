const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../DB/cloudinary');
const verifyToken = require('../middleware/token');
const itemController = require('../controllers/itemcontroller');

// ==========================================
// 1. STORAGE FOR REPORTED ITEMS (Lost & Found)
// ==========================================
const allowedCategories = ['stationary', 'electronics', 'documents', 'accessories', 'other'];

const dynamicStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const type = req.path.includes('/lost') ? 'lost' : 'found';
        const requestedCategory = req.body.category;
        const categoryFolder = allowedCategories.includes(requestedCategory) ? requestedCategory : 'other';

        let folderPath = `LO$TKART/${type}/${categoryFolder}`;
        if (type === 'lost' && categoryFolder === 'other') {
            folderPath = 'LO$TKART/lost';
        }

        return {
            folder: folderPath,
            allowed_formats: ['jpeg', 'png', 'jpg', 'webp'],
            transformation: [{
                width: 1200,
                height: 1200,
                crop: 'limit',
                quality: 'auto'
            }]
        };
    }
});

const uploadItem = multer({ 
    storage: dynamicStorage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// ==========================================
// 2. DEDICATED STORAGE FOR CLAIM PROOFS / BILLS
// ==========================================
const claimProofStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: 'LO$TKART/claims_proof',
            allowed_formats: ['jpeg', 'png', 'jpg', 'webp', 'pdf'],
            transformation: [{
                width: 1600,
                height: 1600,
                crop: 'limit',
                quality: 'auto'
            }]
        };
    }
});

const uploadClaimProof = multer({
    storage: claimProofStorage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// ==========================================
// 3. ROUTES
// ==========================================

// GET Logged-in User's Reports for Dashboard (/api/items/my-reports)
router.get('/my-reports', verifyToken, async (req, res) => {
    try {
        // Use controller function if one already exists
        if (typeof itemController.getUserItems === 'function') {
            return itemController.getUserItems(req, res);
        }

        // Otherwise query the registered Mongoose Item model directly
        const ItemModel = mongoose.models.Item || mongoose.models.item || Object.values(mongoose.models).find(
            m => m.modelName.toLowerCase().includes('item')
        );

        if (!ItemModel) {
            return res.status(500).json({ message: "Item model not found." });
        }

        const userId = String(req.user.id || req.user._id || req.user.userId);

        // Fetch all items and match against common user reference field names
        const allItems = await ItemModel.find().sort({ createdAt: -1 }).lean();
        const userItems = allItems.filter(item => {
            const ownerId =
                item.user ||
                item.userId ||
                item.reportedBy ||
                item.postedBy ||
                item.createdBy;
            return ownerId && String(ownerId._id || ownerId) === userId;
        });

        res.status(200).json(userItems);
    } catch (error) {
        console.error("Error fetching user dashboard reports:", error);
        res.status(500).json({ message: "Failed to load user reports." });
    }
});

// GET Public Items
if (itemController.getItems) {
    router.get('/', itemController.getItems);
}

// POST Found Item
if (itemController.reportFoundItem) {
    router.post('/found', verifyToken, uploadItem.single('image'), itemController.reportFoundItem);
}

// POST Lost Item
if (itemController.reportLostItem) {
    router.post('/lost', verifyToken, uploadItem.single('image'), itemController.reportLostItem);
}

// POST Claim Item -> Uses uploadClaimProof to route images into LO$TKART/claims_proof
router.post('/:id/claim', verifyToken, uploadClaimProof.single('proofImage'), (req, res, next) => {
    if (typeof itemController.claimItem === 'function') {
        return itemController.claimItem(req, res, next);
    }
    res.status(501).json({ message: "Claim handler not configured yet." });
});

module.exports = router;