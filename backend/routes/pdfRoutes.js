/**
 * PDF Routes
 * Defines PDF-related routes
 */

import express from "express";
import multer from "multer";
import { readPdf, readResumePdf, generateFromPdfHandler } from "../controllers/pdfController.js";
import { appConfig } from "../config/index.js";
import { clerkAuth } from "../middleware/auth.js";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  dest: appConfig.uploadsDir,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// POST /pdf/read-pdf - Read PDF from GitHub URL
router.post('/read-pdf', clerkAuth, readPdf);

// POST /pdf/read-resume-pdf - Read resume PDF (multipart upload)
router.post('/read-resume-pdf', upload.single('pdf'), (req, res, next) => {
  if (req.file === undefined && !req.file) {
    // File wasn't uploaded through multer, continue anyway
  }
  next();
}, readResumePdf);

// POST /pdf/generate-from-pdf - Generate learning from PDF
router.post('/generate-from-pdf', clerkAuth, generateFromPdfHandler);

export default router;
