// src/utils/cloudinary.js
const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

// buffer → Cloudinary
const uploadImage = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: "image" },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );

        stream.end(buffer);
    });
};

module.exports = { cloudinary, uploadImage };
