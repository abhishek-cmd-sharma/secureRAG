import express from 'express';
import { body } from 'express-validator';
import {
  askQuestion,
  summarizeDocument,
  compareDocuments,
  extractDocumentInfo,
  getConversations,
  getConversationById,
  deleteConversation
} from '../controllers/chat.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

// List user's conversations
router.get('/conversations', getConversations);

// Get single conversation details
router.get('/conversations/:id', getConversationById);

// Delete conversation
router.delete('/conversations/:id', deleteConversation);

// Submit RAG question (supports multi-document & conversational memory)
router.post(
  '/ask',
  [
    body('question')
      .trim()
      .notEmpty()
      .withMessage('Question is required.')
      .isLength({ max: 2000 })
      .withMessage('Question cannot exceed 2000 characters.')
  ],
  askQuestion
);

// Summarize document
router.post(
  '/summarize',
  [
    body('documentId')
      .trim()
      .notEmpty()
      .withMessage('documentId is required.')
  ],
  summarizeDocument
);

// Compare multiple documents
router.post(
  '/compare',
  [
    body('documentIds')
      .isArray({ min: 2 })
      .withMessage('documentIds must be an array of at least 2 document IDs.')
  ],
  compareDocuments
);

// Extract structured intelligence
router.post(
  '/extract',
  [
    body('documentId')
      .trim()
      .notEmpty()
      .withMessage('documentId is required.')
  ],
  extractDocumentInfo
);

export default router;
