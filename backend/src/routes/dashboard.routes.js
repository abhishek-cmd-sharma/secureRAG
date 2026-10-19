import express from 'express';
import {
  getDashboardSummary,
  getDashboardActivity
} from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/summary', getDashboardSummary);
router.get('/activity', getDashboardActivity);

export default router;
