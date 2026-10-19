import express from 'express';
import { body } from 'express-validator';
import {
  getDocuments,
  getDocumentById,
  createDocument,
  uploadDocument,
  reindexDocument,
  getDocumentStatus,
  updateDocument,
  deleteDocument
} from '../controllers/document.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { uploadMiddleware } from '../middleware/upload.middleware.js';

const router = express.Router();

router.use(authenticate);

// List accessible documents (filtered automatically by user's role)
router.get('/', getDocuments);

// Real PDF upload and RAG indexing
router.post('/upload', uploadMiddleware.single('file'), uploadDocument);

// Get single document status
router.get('/:id/status', getDocumentStatus);

// Re-index document vectors
router.post('/:id/reindex', reindexDocument);

// Get single document metadata
router.get('/:id', getDocumentById);

// Register document metadata
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Document title is required'),
    body('accessLevel')
      .optional()
      .isIn(['Public', 'Internal', 'Confidential', 'Restricted'])
      .withMessage('Valid access level is required')
  ],
  createDocument
);

// Update document metadata
router.patch('/:id', updateDocument);

// Delete document (cleans up MongoDB, physical PDF storage, and Qdrant vectors)
router.delete('/:id', deleteDocument);

export default router;
