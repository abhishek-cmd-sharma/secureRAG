import express from 'express';
import {
  getAuditLogs,
  getAuditLogById,
  exportAuditLogsCSV
} from '../controllers/audit.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = express.Router();

router.use(authenticate);

// Audit logs viewable by Admins and Managers
router.get('/', authorizeRoles('admin', 'manager'), getAuditLogs);
router.get('/export/csv', authorizeRoles('admin', 'manager'), exportAuditLogsCSV);
router.get('/:id', authorizeRoles('admin', 'manager'), getAuditLogById);

export default router;
