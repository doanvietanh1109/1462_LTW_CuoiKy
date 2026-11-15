const multer = require("multer");
const { sendError } = require("../utils/response");

// Use memory storage for Cloudinary upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only JPEG, PNG and WebP are allowed."), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    },
});

const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return sendError(res, "File size too large. Maximum 5MB allowed.", null, 400);
        }
        return sendError(res, `Upload error: ${err.message}`, null, 400);
    } else if (err) {
        return sendError(res, err.message, null, 400);
    }
    next();
};

const hasValidImageSignature = (buffer) => {
    if (!Buffer.isBuffer(buffer)) return false;
    const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isWebp = buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
    return isJpeg || isPng || isWebp;
};

const validateImageFiles = (req, res, next) => {
    const files = req.files || (req.file ? [req.file] : []);
    if (files.some((file) => !hasValidImageSignature(file.buffer))) {
        return sendError(res, "Nội dung file không phải ảnh JPG, PNG hoặc WebP hợp lệ", null, 400);
    }
    return next();
};

module.exports = { upload, handleMulterError, validateImageFiles };
