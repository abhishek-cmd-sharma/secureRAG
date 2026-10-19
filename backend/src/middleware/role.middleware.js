import { createAuditLog } from '../utils/auditService.js';

export function authorizeRoles(...allowedRoles) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());
    const userRole = (req.user.role || '').toLowerCase();

    if (!normalizedAllowed.includes(userRole)) {
      // Record denied audit event
      await createAuditLog({
        req,
        action: 'PERMISSION_DENIED',
        resourceType: 'AUTH',
        resourceName: req.originalUrl,
        result: 'denied',
        details: `Access forbidden: user with role '${req.user.role}' attempted action requiring [${allowedRoles.join(', ')}]`
      });

      return res.status(403).json({
        success: false,
        message: `Forbidden: Insufficient privileges. Required role: [${allowedRoles.join(', ')}]. Your role: '${req.user.role}'.`
      });
    }

    next();
  };
}

export function enforceTenantIsolation(paramKey = 'orgId') {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const requestedOrgId = req.params[paramKey] || req.body[paramKey] || req.query[paramKey];
    if (requestedOrgId && String(requestedOrgId) !== String(req.user.organizationId?._id || req.user.organizationId)) {
      await createAuditLog({
        req,
        action: 'CROSS_TENANT_VIOLATION_BLOCKED',
        resourceType: 'ORGANIZATION',
        resourceId: String(requestedOrgId),
        result: 'denied',
        details: `Cross-tenant violation: User from org '${req.user.organizationId}' attempted to access org '${requestedOrgId}'`
      });

      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot access or modify resources belonging to another organization.'
      });
    }

    next();
  };
}
