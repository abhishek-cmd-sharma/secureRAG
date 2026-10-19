import express from 'express';
import { body } from 'express-validator';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = express.Router();

router.use(authenticate);

// List users: Admin and Manager
router.get('/', authorizeRoles('admin', 'manager'), getUsers);

// Get single user
router.get('/:id', authorizeRoles('admin', 'manager'), getUserById);

// Create user: Admin and Manager (Managers can only create employees)
router.post(
  '/',
  authorizeRoles('admin', 'manager'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required')
  ],
  createUser
);

// Update user: Admin only
router.patch('/:id', authorizeRoles('admin'), updateUser);

// Delete user: Admin only
router.delete('/:id', authorizeRoles('admin'), deleteUser);

export default router;
