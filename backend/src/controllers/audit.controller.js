import { AuditLog } from '../models/AuditLog.js';

export async function getAuditLogs(req, res, next) {
  try {
    const { action, result, search, startDate, endDate, page = 1, limit = 15 } = req.query;
    const userOrgId = req.user.organizationId?._id || req.user.organizationId;

    const query = {
      organizationId: userOrgId
    };

    if (action && action !== 'All') {
      query.action = action.toUpperCase();
    }

    if (result && result !== 'All') {
      query.result = result.toLowerCase();
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { actorName: regex },
        { actorEmail: regex },
        { resourceName: regex },
        { details: regex },
        { action: regex }
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('organizationId', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments(query)
    ]);

    // Format for frontend
    const formattedLogs = logs.map(l => ({
      _id: l._id,
      id: String(l._id),
      timestamp: l.createdAt.toISOString().replace('T', ' ').substring(0, 19),
      user: l.actorName,
      email: l.actorEmail,
      role: l.actorRole.charAt(0).toUpperCase() + l.actorRole.slice(1),
      organization: l.organizationId?.name || 'NovaCorp Global',
      action: l.action,
      resource: l.resourceName || l.resourceType,
      ipAddress: l.ipAddress,
      result: l.result === 'allowed' ? 'Allowed' : 'Denied',
      details: l.details
    }));

    res.json({
      success: true,
      data: formattedLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getAuditLogById(req, res, next) {
  try {
    const { id } = req.params;
    const userOrgId = req.user.organizationId?._id || req.user.organizationId;

    const log = await AuditLog.findOne({
      _id: id,
      organizationId: userOrgId
    }).populate('organizationId', 'name slug');

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Audit log record not found.'
      });
    }

    res.json({
      success: true,
      data: log
    });
  } catch (err) {
    next(err);
  }
}

export async function exportAuditLogsCSV(req, res, next) {
  try {
    const userOrgId = req.user.organizationId?._id || req.user.organizationId;

    const logs = await AuditLog.find({ organizationId: userOrgId })
      .populate('organizationId', 'name slug')
      .sort({ createdAt: -1 })
      .limit(1000);

    const headers = [
      'Timestamp (UTC)',
      'Actor Name',
      'Actor Email',
      'Actor Role',
      'Action',
      'Resource Name',
      'Result',
      'IP Address',
      'Details'
    ];

    const rows = logs.map(l => [
      `"${l.createdAt.toISOString().replace('T', ' ').substring(0, 19)}"`,
      `"${(l.actorName || '').replace(/"/g, '""')}"`,
      `"${(l.actorEmail || '').replace(/"/g, '""')}"`,
      `"${(l.actorRole || '').replace(/"/g, '""')}"`,
      `"${(l.action || '').replace(/"/g, '""')}"`,
      `"${(l.resourceName || l.resourceType || '').replace(/"/g, '""')}"`,
      `"${l.result}"`,
      `"${l.ipAddress}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=securerag-audit-${Date.now()}.csv`);
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
}
