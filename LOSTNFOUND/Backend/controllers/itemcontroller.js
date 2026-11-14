const Item = require('../models/item');
const User = require('../models/user'); // Required for populate to resolve
const Claim = require('../models/claim');

const reportFoundItem = async (req, res) => {
    try {
        const { itemName, location, category, description, secretIdentifier } = req.body;
        const imagePath = req.file ? req.file.path : null;

        const newItem = new Item({
            status: 'found',
            itemName: itemName || `${category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Found Item'}`,
            location,
            category: category || 'other',
            description: description || '',
            imagePath,
            secretIdentifier,
            reportedBy: req.user ? req.user.id : null,
            verificationStatus: 'pending',
            isVisible: false
        });

        await newItem.save();
        console.log(`[REPORT FOUND] New item created with ID: ${newItem._id} (Status: pending)`);
        res.status(201).json({
            message: 'Found item reported successfully. Sent to admin for verification.',
            item: newItem
        });
    } catch (error) {
        console.error("SAVE ERROR (FOUND):", error);
        res.status(500).json({ message: 'Server Error while saving item' });
    }
};

const reportLostItem = async (req, res) => {
    try {
        const { itemName, colour, location, time, date, description, secretIdentifier, category } = req.body;
        const imagePath = req.file ? req.file.path : null;

        const newItem = new Item({
            status: 'lost',
            itemName: itemName || 'Lost Item',
            colour,
            location,
            time,
            date,
            category: category || 'other',
            description: description || '',
            secretIdentifier,
            imagePath,
            reportedBy: req.user ? req.user.id : null,
            verificationStatus: 'pending',
            isVisible: false
        });

        await newItem.save();
        console.log(`[REPORT LOST] New item created with ID: ${newItem._id} (Status: pending)`);
        res.status(201).json({
            message: 'Lost item reported. It will appear in inventory after admin verification.',
            item: newItem
        });
    } catch (error) {
        console.error("SAVE ERROR (LOST):", error);
        res.status(500).json({ message: 'Server Error while saving item' });
    }
};

// Public Inventory: ONLY approved, visible items
// If serving frontend statically via Express or relative path:
// Built-in offline SVG placeholder (Navy & Gold LO$TKART theme, no external network needed)
// Built-in offline SVG placeholder
const DEFAULT_PLACEHOLDER = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22300%22%20viewBox%3D%220%200%20400%20300%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23001f3f%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22115%22%20r%3D%2235%22%20fill%3D%22%23003366%22%2F%3E%3Cpath%20d%3D%22M185%20115%20Q200%2095%20215%20115%20Q200%20135%20185%20115%20Z%22%20fill%3D%22none%22%20stroke%3D%22%23ffcc00%22%20stroke-width%3D%223%22%2F%3E%3Cline%20x1%3D%22180%22%20y1%3D%22135%22%20x2%3D%22220%22%20y2%3D%2295%22%20stroke%3D%22%23ef4444%22%20stroke-width%3D%223%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%22185%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22Arial%2C%20sans-serif%22%20font-size%3D%2218%22%20font-weight%3D%22bold%22%3EIMAGE%20HIDDEN%3C%2Ftext%3E%3Ctext%20x%3D%2250%25%22%20y%3D%22212%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%2394a3b8%22%20font-family%3D%22Arial%2C%20sans-serif%22%20font-size%3D%2212%22%3EVerification%20Required%3C%2Ftext%3E%3C%2Fsvg%3E";

const getItems = async (req, res) => {
    try {
        // .lean() is essential: allows rewriting object properties before sending JSON
        const items = await Item.find({
            verificationStatus: 'approved',
            isVisible: true
        })
            .select('-secretIdentifier -rejectionReason')   // ✅ HIDE FROM PUBLIC
            .populate({
                path: 'reportedBy',
                select: 'name isBlocked'                     // ✅ NO email
            })
            .sort({ createdAt: -1 })
            .lean();

        const processedItems = items
            .filter(item => !item.reportedBy || !item.reportedBy.isBlocked)
            .map(item => {
                // If showImage is false, replace real Cloudinary image with the SVG placeholder
                if (item.showImage === false || item.showImage === 'false') {
                    item.imagePath = DEFAULT_PLACEHOLDER;
                }
                return item;
            });

        console.log(`[INVENTORY API] Sending ${processedItems.length} items to frontend.`);
        res.status(200).json(processedItems);
    } catch (error) {
        console.error('Error in getItems:', error);
        res.status(500).json({ error: 'Failed to retrieve inventory items' });
    }
};

const claimItem = async (req, res) => {
    try {
        const { brand, uniqueMarks, distinctiveFeature, contentInside, additionalInfo } = req.body;
        // Cloudinary URL from the dedicated claims_proof folder
        const proofImageUrl = req.file ? req.file.path : '';

        if (!uniqueMarks || !distinctiveFeature) {
            return res.status(400).json({
                message: 'Please provide both unique marks and distinctive features.'
            });
        }

        const newClaim = new Claim({
            itemId: req.params.id,
            claimantId: req.user.id,
            brand: brand || '',
            uniqueMarks,
            distinctiveFeature,
            contentInside: contentInside || '',
            additionalInfo: additionalInfo || '',
            proofImageUrl,
            status: 'pending'
        });

        await newClaim.save();
        res.status(201).json({
            message: 'Claim submitted successfully with proof. Awaiting admin verification.',
            claim: newClaim
        });
    } catch (error) {
        console.error('Claim submission error:', error);
        res.status(500).json({ error: 'Failed to submit claim verification request.' });
    }
};

module.exports = {
    reportFoundItem,
    reportLostItem,
    getItems,
    claimItem
};