const express = require('express');
const router = express.Router();

// Middlewares
const verifyToken = require('../middleware/token');
const verifyAdmin = require('../middleware/verifyAdmin');

// Controllers
const {
    getPendingItems,
    getAllAdminItems,
    moderateItem,
    toggleItemVisibility,
    deleteItem,
    setUserBlockStatus,
    getClaims,
    decideClaim
} = require('../controllers/admincontroller');

// Protect all routes below with authentication and admin role verification
router.use(verifyToken, verifyAdmin);

// ==========================================
// 1. ITEM VERIFICATION & MODERATION
// ==========================================

// GET all items waiting for approval (verificationStatus: 'pending')
router.get('/items/pending', getPendingItems);

// GET all items (approved, rejected, pending, claimed) for admin review
router.get('/items', getAllAdminItems);

// PATCH approve or reject a reported item (updates verificationStatus & isVisible)
router.patch('/items/:id/moderate', moderateItem);

// PATCH manually toggle an item's visibility on/off in the public inventory
router.patch('/items/:id/visibility', toggleItemVisibility);

// DELETE remove an item permanently from the database
router.delete('/items/:id', deleteItem);

// ==========================================
// 2. USER MANAGEMENT & RESTRICTIONS
// ==========================================

// PATCH block or unblock a user (also hides all their posts if blocked)
router.patch('/users/:id/block', setUserBlockStatus);

// ==========================================
// 3. CLAIM VERIFICATION
// ==========================================

// GET all submitted ownership claims
router.get('/claims', getClaims);

// PATCH verify or reject a user's claim on a found item
router.patch('/claims/:claimId/decide', decideClaim);

module.exports = router;