const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../DB/cloudinary');

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

const upload = multer({
    storage: dynamicStorage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = upload;