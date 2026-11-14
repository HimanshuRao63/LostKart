const Item = require('../models/item');
const User = require('../models/user');
const Claim = require('../models/claim');

// 1. Get all pending items awaiting approval
exports.getPendingItems = async (req, res) => {
    try {
        const items = await Item.find({
            $or: [
                { verificationStatus: 'pending' },
                { verificationStatus: { $exists: false } }
            ]
        })
            .populate('reportedBy', 'name email phone rollNo')
            .sort({ createdAt: -1 });

        res.status(200).json(items);
    } catch (err) {
        console.error("GET PENDING ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};

// 2. Get all items across all statuses (pending, approved, rejected, claimed)
exports.getAllAdminItems = async (req, res) => {
    try {
        const items = await Item.find()
            .populate('reportedBy', 'name email phone rollNo')
            .sort({ createdAt: -1 });
        res.status(200).json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. Approve or Reject an item
// In Backend/controllers/admincontroller.js:
// In Backend/controllers/admincontroller.js
exports.moderateItem = async (req, res) => {
    try {
        const { status, showImage, rejectionReason } = req.body;
        const isVisible = status === 'approved';

        // Accurately parse boolean false OR string "false"
        const shouldShowImage = !(showImage === false || showImage === 'false');

        const updatedItem = await Item.findByIdAndUpdate(
            req.params.id,
            {
                verificationStatus: status,
                showImage: shouldShowImage,
                isVisible: isVisible,
                rejectionReason: rejectionReason || ''
            },
            { new: true } // Returns the updated document
        );

        if (!updatedItem) {
            return res.status(404).json({ message: "Item not found" });
        }

        console.log(`[ADMIN] Item "${updatedItem.itemName}" updated -> status: "${updatedItem.verificationStatus}" | showImage: ${updatedItem.showImage}`);

        res.status(200).json({
            message: `Item marked as ${status}.`,
            item: updatedItem
        });
    } catch (err) {
        console.error("MODERATE ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};

// 4. Toggle Visibility of an approved item in public inventory
exports.toggleItemVisibility = async (req, res) => {
    try {
        const { isVisible } = req.body;
        const item = await Item.findByIdAndUpdate(
            req.params.id,
            { isVisible },
            { new: true }
        );
        res.status(200).json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 5. Delete an item permanently
exports.deleteItem = async (req, res) => {
    try {
        await Item.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Item deleted permanently' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 6. Block or Unblock a user
exports.setUserBlockStatus = async (req, res) => {
    try {
        const { isBlocked, blockReason } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isBlocked, blockReason: blockReason || '' },
            { new: true }
        );

        // Hide all items reported by this user if blocked
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        if (isBlocked) {
            await Item.updateMany({ reportedBy: user._id }, { isVisible: false });
        }

        res.status(200).json({
            message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
            user
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 7. Get all ownership claims
// Add or replace these two functions in Backend/controllers/admincontroller.js:

exports.getClaims = async (req, res) => {
    try {
        const claims = await Claim.find()
            .populate({
                path: 'itemId',
                select: 'itemName category location description imagePath secretIdentifier status verificationStatus isVisible'
            })
            .populate({
                path: 'claimantId',
                select: 'name email phone rollNo'
            })
            .sort({ createdAt: -1 });

        res.status(200).json(claims);
    } catch (err) {
        console.error("GET CLAIMS ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.decideClaim = async (req, res) => {
    try {
        const { status, adminNotes } = req.body; // 'verified' or 'rejected'

        // This only mutates status and adminNotes; all 5 fields and proofImageUrl remain in MongoDB permanently
        const claim = await Claim.findByIdAndUpdate(
            req.params.claimId,
            { status, adminNotes: adminNotes || '' },
            { new: true }
        );

        if (!claim) {
            return res.status(404).json({ message: "Claim not found" });
        }

        if (status === 'verified') {
            // Update item visibility in inventory, but do NOT delete the claim record
            await Item.findByIdAndUpdate(claim.itemId, {
                verificationStatus: 'claimed',
                isVisible: false
            });
        }

        res.status(200).json({
            message: `Claim marked as ${status}. Verification data preserved.`,
            claim
        });
    } catch (err) {
        console.error("DECIDE CLAIM ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};