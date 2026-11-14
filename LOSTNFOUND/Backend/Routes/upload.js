// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const { CloudinaryStorage } = require('multer-storage-cloudinary');

// // 1. Imports
// const verifyToken = require('../middleware/token'); 
// const cloudinary = require('../DB/cloudinary'); 
// // IMPORTANT: Make sure reportLostItem is imported alongside reportFoundItem
// const { reportFoundItem, reportLostItem } = require('../controllers/itemcontroller');

// // 2. Setup storage for FOUND items
// const foundStorage = new CloudinaryStorage({
//     cloudinary: cloudinary,
//     params: {
//         folder: 'lostkart/found',
//         allowed_formats: ['jpeg', 'png', 'jpg', 'webp'],
//         transformation: [{
//             width: 1200,
//             height: 1200,
//             crop: 'limit',
//             quality: 'auto'
//         }]
//     }
// });

// // 3. Setup storage for LOST items
// const lostStorage = new CloudinaryStorage({
//     cloudinary: cloudinary,
//     params: {
//         folder: 'lostkart/lost',
//         allowed_formats: ['jpeg', 'png', 'jpg', 'webp'],
//         transformation: [{
//             width: 1200,
//             height: 1200,
//             crop: 'limit',
//             quality: 'auto'
//         }]
//     }
// });

// // 4. Create Multer instances (Added your 5MB file limit here for safety)
// const uploadFound = multer({ 
//     storage: foundStorage,
//     limits: { fileSize: 5 * 1024 * 1024 } 
// });

// const uploadLost = multer({ 
//     storage: lostStorage,
//     limits: { fileSize: 5 * 1024 * 1024 }
// });

// // 5. Routes
// // These routes will automatically upload the image to the correct Cloudinary folder 
// // BEFORE passing the request to your controllers (reportFoundItem / reportLostItem)
// router.post('/found', verifyToken, uploadFound.single('image'), reportFoundItem);
// router.post('/lost', verifyToken, uploadLost.single('image'), reportLostItem);

// // Export the router exactly once at the end
// module.exports = router;