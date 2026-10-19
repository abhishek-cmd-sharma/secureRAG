import express from 'express';
import { body } from 'express-validator';
import {
  getOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization
} from '../controllers/organization.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = express.Router();

router.use(authenticate);

// List organizations
router.get('/', getOrganizations);

// Get single organization
router.get('/:id', getOrganizationById);

// Create new organization: Admin only
router.post(
  '/',
  authorizeRoles('admin'),
  [
    body('name').trim().notEmpty().withMessage('Organization name is required'),
    body('domain').trim().notEmpty().withMessage('Domain is required')
  ],
  createOrganization
);

// Update organization: Admin only
router.patch('/:id', authorizeRoles('admin'), updateOrganization);

export default router;
