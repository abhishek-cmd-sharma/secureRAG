import { Document } from '../models/Document.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';

export async function getDashboardSummary(req, res, next) {
  try {
    const userOrgId = req.user.organizationId?._id || req.user.organizationId;
    const userRole = (req.user.role || '').toLowerCase();

    // Role-scoped document query
    const docQuery = { organizationId: userOrgId };
    if (userRole === 'employee') {
      docQuery.accessLevel = { $in: ['Public', 'Internal'] };
    } else if (userRole === 'manager') {
      docQuery.accessLevel = { $in: ['Public', 'Internal', 'Confidential'] };
    }

    const [
      totalDocuments,
      indexedDocuments,
      processingDocuments,
      failedDocuments,
      activeUsers,
      totalAuditEvents,
      deniedEvents,
      allowedEvents,
      totalAiQueries,
      recentDocuments,
      recentAudits
    ] = await Promise.all([
      Document.countDocuments(docQuery),
      Document.countDocuments({ ...docQuery, status: 'indexed' }),
      Document.countDocuments({ ...docQuery, status: 'processing' }),
      Document.countDocuments({ ...docQuery, status: 'failed' }),
      User.countDocuments({ organizationId: userOrgId, isActive: true }),
      AuditLog.countDocuments({ organizationId: userOrgId }),
      AuditLog.countDocuments({ organizationId: userOrgId, result: 'denied' }),
      AuditLog.countDocuments({ organizationId: userOrgId, result: 'allowed' }),
      AuditLog.countDocuments({ organizationId: userOrgId, action: 'RAG_QUERY' }),
      Document.find(docQuery)
        .sort({ createdAt: -1 })
        .limit(4)
        .populate('ownerId', 'name email'),
      AuditLog.find({ organizationId: userOrgId })
        .sort({ createdAt: -1 })
        .limit(4)
    ]);

    // Format recent docs for frontend
    const formattedRecentDocs = recentDocuments.map(d => ({
      _id: d._id,
      id: String(d._id),
      name: d.title,
      type: d.fileType,
      size: d.fileSize,
      accessLevel: d.accessLevel,
      status: d.status,
      chunksCount: d.chunksCount,
      uploadDate: d.createdAt.toISOString().split('T')[0]
    }));

    // Format recent audits
    const formattedRecentAudits = recentAudits.map(l => ({
      _id: l._id,
      id: String(l._id),
      timestamp: l.createdAt.toISOString().replace('T', ' ').substring(0, 19),
      user: l.actorName,
      email: l.actorEmail,
      role: l.actorRole.charAt(0).toUpperCase() + l.actorRole.slice(1),
      action: l.action,
      resource: l.resourceName || l.resourceType,
      result: l.result === 'allowed' ? 'Allowed' : 'Denied',
      details: l.details
    }));

    res.json({
      success: true,
      data: {
        kpis: {
          totalDocuments,
          indexedDocuments,
          processingDocuments,
          failedDocuments,
          activeUsers,
          totalAuditEvents,
          deniedEvents,
          allowedEvents,
          totalAiQueries,
          aiQueryStatus: 'Phase 3/4 Production Pipeline Active (Qdrant + Gemini)',
          aiQuestionsSimulated: totalAiQueries
        },
        recentDocuments: formattedRecentDocs,
        recentAudits: formattedRecentAudits
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getDashboardActivity(req, res, next) {
  try {
    const userOrgId = req.user.organizationId?._id || req.user.organizationId;

    // Aggregate audit actions by day for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activityByDay = await AuditLog.aggregate([
      {
        $match: {
          organizationId: userOrgId,
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            day: { $dayOfWeek: '$createdAt' },
            result: '$result'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Aggregate documents by classification
    const docsByAccess = await Document.aggregate([
      {
        $match: { organizationId: userOrgId }
      },
      {
        $group: {
          _id: '$accessLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        activityByDay,
        docsByAccess
      }
    });
  } catch (err) {
    next(err);
  }
}
