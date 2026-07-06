/**
 * Configures a multer instance for handling multipart/form-data file
 * uploads in memory (no disk writes), so the resulting buffer can be
 * forwarded directly to Cloudinary via uploadBufferToCloudinary
 * (see src/config/cloudinary.js). Restricts uploads to image files only.
 */
import multer from 'multer';

// Keeps uploaded files in memory as Buffers instead of writing to disk.
const storage = multer.memoryStorage();

/**
 * Multer file filter that only accepts image MIME types.
 *
 * @param {import('express').Request} _req - Incoming request (unused).
 * @param {Express.Multer.File} file - The file being uploaded; checked via `file.mimetype`.
 * @param {(error: Error|null, acceptFile: boolean) => void} cb - Callback to accept or reject the file.
 * @returns {void}
 * @throws Does not throw; passes an Error to `cb` when the file is not an image, which multer
 *   surfaces as an upload error.
 */
function fileFilter(_req, file, cb) {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes'), false);
  }
}

/**
 * Multer middleware configured for in-memory image uploads.
 * Limits file size to 5 MB and rejects non-image files via `fileFilter`.
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});
