// middleware/upload.js
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "coloader-challans", // Folder name in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "pdf"],
    transformation: [{ width: 1500, height: 1500, crop: "limit" }], // Optimize images
  },
});

// File filter - images and PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only image files and PDFs are allowed!"), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Max 5MB per file
  },
});

export default upload;