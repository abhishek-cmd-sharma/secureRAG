import { Organization } from '../models/Organization.js';
import { User } from '../models/User.js';
import { Document } from '../models/Document.js';
import { createAuditLog } from '../utils/auditService.js';

export async function getOrganizations(req, res, next) {
  try {
    const isGlobalAdmin = req.user.role === 'admin';
    const userOrgId = req.user.organizationId?._id || req.user.organizationId;

    let query = {};
    if (!isGlobalAdmin) {
      // Non-admins can only see their own organization summary
      query._id = userOrgId;
    }

    const orgs = await Organization.find(query).sort({ createdAt: -1 });

    // Attach computed counts for active users & documents
    const orgsWithCounts = await Promise.all(
      orgs.map(async (org) => {
        const [activeUsers, documentsCount] = await Promise.all([
          User.countDocuments({ organizationId: org._id, isActive: true }),
          Document.countDocuments({ organizationId: org._id })
        ]);
        return {
          ...org.toObject(),
          id: String(org._id),
          status: org.isActive !== false ? 'Active' : 'Inactive',
          activeUsers,
          documentsCount
        };
      })
    );

    res.json({
      success: true,
      data: orgsWithCounts
    });
  } catch (err) {
    next(err);
  }
}

export async function getOrganizationById(req, res, next) {
  try {
    const { id } = req.params;
    const userOrgId = req.user.organizationId?._id || req.user.organizationId;

    // Tenant isolation: Users can only view their own organization unless admin
    if (String(id) !== String(userOrgId) && req.user.role !== 'admin') {
      await createAuditLog({
        req,
        action: 'CROSS_TENANT_ORGANIZATION_VIEW_BLOCKED',
        resourceType: 'ORGANIZATION',
        resourceId: String(id),
        result: 'denied',
        details: 'Unauthorized cross-organization inspection attempted'
      });

      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot access configuration for other organizations.'
      });
    }

    const org = await Organization.findById(id);
    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found.'
      });
    }

    const [activeUsers, documentsCount] = await Promise.all([
      User.countDocuments({ organizationId: org._id, isActive: true }),
      Document.countDocuments({ organizationId: org._id })
    ]);

    res.json({
      success: true,
      data: {
        ...org.toObject(),
        activeUsers,
        documentsCount
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function createOrganization(req, res, next) {
  try {
    const { name, domain, tier, description, seats } = req.body;

    if (!name || !domain) {
      return res.status(400).json({
        success: false,
        message: 'Organization name and domain are required.'
      });
    }

    const slug = domain.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    const existing = await Organization.findOne({ slug });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An organization with this domain or slug already exists.'
      });
    }

    const newOrg = await Organization.create({
      name: name.trim(),
      slug,
      description: description || `Dedicated workspace for ${name}`,
      tier: tier || 'Enterprise Plus',
      seats: Number(seats) || 50,
      createdBy: req.user._id,
      isActive: true
    });

    await createAuditLog({
      req,
      organizationId: newOrg._id,
      action: 'ORGANIZATION_CREATED',
      resourceType: 'ORGANIZATION',
      resourceId: String(newOrg._id),
      resourceName: newOrg.name,
      result: 'allowed',
      details: `Provisioned new tenant organization with tier '${newOrg.tier}'`
    });

    res.status(201).json({
      success: true,
      data: newOrg,
      message: 'Organization workspace provisioned successfully.'
    });
  } catch (err) {
    next(err);
  }
}

export async function updateOrganization(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, tier, seats, isActive } = req.body;
    const userOrgId = req.user.organizationId?._id || req.user.organizationId;

    if (String(id) !== String(userOrgId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot modify other organizations.'
      });
    }

    const org = await Organization.findById(id);
    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found.'
      });
    }

    if (name) org.name = name.trim();
    if (description !== undefined) org.description = description.trim();
    if (tier) org.tier = tier;
    if (seats !== undefined) org.seats = Math.max(1, Number(seats));
    if (isActive !== undefined) org.isActive = Boolean(isActive);

    await org.save();

    await createAuditLog({
      req,
      organizationId: org._id,
      action: 'ORGANIZATION_UPDATED',
      resourceType: 'ORGANIZATION',
      resourceId: String(org._id),
      resourceName: org.name,
      result: 'allowed',
      details: `Updated workspace settings (tier: ${org.tier}, seats: ${org.seats})`
    });

    res.json({
      success: true,
      data: org,
      message: 'Organization updated successfully.'
    });
  } catch (err) {
    next(err);
  }
}
