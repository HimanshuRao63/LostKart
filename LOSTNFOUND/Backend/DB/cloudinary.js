const cloudinary = require('cloudinary').v2;

// Configure Cloudinary directly without wrapping it in a function
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = cloudinary;