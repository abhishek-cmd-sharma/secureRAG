import { AuditLog } from '../models/AuditLog.js';

export async function createAuditLog({
  req,
  organizationId,
  actorId,
  actorName,
  actorEmail,
  actorRole,
  action,
  resourceType,
  resourceId = null,
  resourceName = '',
  result = 'allowed',
  details = ''
}) {
  try {
    const ipAddress = req
      ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1').split(',')[0].trim()
      : '127.0.0.1';
    const userAgent = req?.headers['user-agent'] || '';

    // If actor info is on req.user, auto-fill if not passed
    const finalActorId = actorId !== undefined ? actorId : req?.user?._id || null;
    const finalActorName = actorName || req?.user?.name || 'Anonymous';
    const finalActorEmail = actorEmail || req?.user?.email || 'unknown@domain';
    const finalActorRole = actorRole || req?.user?.role || 'anonymous';
    const finalOrgId = organizationId || req?.user?.organizationId;

    if (!finalOrgId) {
      // For global or failed actions without org, skip or store default
      return null;
    }

    const requestId = req?.id || req?.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const rawData = `${finalOrgId}:${finalActorId}:${action}:${resourceType}:${resourceId}:${result}:${ipAddress}:${details}`;
    const crypto = await import('crypto');
    const integrityHash = crypto.createHash('sha256').update(rawData).digest('hex');

    const logEntry = await AuditLog.create({
      organizationId: finalOrgId,
      actorId: finalActorId,
      actorName: finalActorName,
      actorEmail: finalActorEmail,
      actorRole: finalActorRole,
      action: action.toUpperCase(),
      resourceType,
      resourceId: resourceId ? String(resourceId) : null,
      resourceName,
      result: result.toLowerCase(),
      ipAddress,
      userAgent,
      requestId,
      integrityHash,
      details
    });

    return logEntry;
  } catch (err) {
    console.error('Failed to write audit log entry:', err);
    return null;
  }
}
