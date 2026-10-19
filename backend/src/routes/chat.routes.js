import express from 'express';
import { body } from 'express-validator';
import {
  askQuestion,
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

// Submit RAG question
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

export default router;
