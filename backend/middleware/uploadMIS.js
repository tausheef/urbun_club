// middleware/uploadMIS.js
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// Cloudinary storage — MIS receipt images stored in 'mis-receipts' folder
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "mis-receipts",
    allowed_formats: ["jpg", "jpeg", "png"],
    // No transformation — keep full quality for business records
  },
});

// File filter — only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const uploadMIS = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

export default uploadMIS;