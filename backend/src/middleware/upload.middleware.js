import fs from 'fs';
import path from 'path';
import multer from 'multer';
import crypto from 'crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'storage', 'uploads');
const MAX_UPLOAD_SIZE_MB = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '10', 10);

// Ensure storage directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer disk storage with randomized server-controlled filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const randomKey = crypto.randomBytes(16).toString('hex');
    cb(null, `doc_${Date.now()}_${randomKey}${ext}`);
  }
});

// File filter: strict PDF checking
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.mimetype === 'application/pdf' || ext === '.pdf') {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type: Only standard PDF documents are supported for RAG indexing.'), false);
  }
};

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_SIZE_MB * 1024 * 1024 // 10MB default
  },
  fileFilter
});

export { UPLOAD_DIR, MAX_UPLOAD_SIZE_MB };
