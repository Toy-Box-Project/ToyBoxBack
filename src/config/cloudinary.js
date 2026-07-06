/**
 * Configures the Cloudinary SDK from environment variables and exposes a
 * promise-based helper to upload in-memory buffers (e.g. multer memory
 * storage output) as an alternative to Cloudinary's callback-based stream API.
 */
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Uploads a raw file buffer to Cloudinary using an upload stream.
 *
 * @param {Buffer} buffer - The file contents to upload (typically from multer's memory storage).
 * @param {object} [options={}] - Cloudinary upload options (e.g. folder, public_id, transformation).
 * @returns {Promise<object>} Resolves with the Cloudinary upload result object.
 * @throws {Error} Rejects the returned promise if Cloudinary reports an upload error.
 */
export function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });
}

export default cloudinary;
