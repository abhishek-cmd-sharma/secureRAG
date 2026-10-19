import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { createAuditLog } from '../utils/auditService.js';

export async function getUsers(req, res, next) {
  try {
    const { search, role, status, page = 1, limit = 10 } = req.query;

    const query = {
      organizationId: req.user.organizationId?._id || req.user.organizationId
    };

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }, { title: regex }];
    }

    if (role && role !== 'All') {
      query.role = role.toLowerCase();
    }

    if (status && status !== 'All') {
      query.isActive = status === 'Active';
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-passwordHash')
        .populate('organizationId', 'name slug tier')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: users.map(u => u.toSafeObject()),
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

export async function getUserById(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findOne({
      _id: id,
      organizationId: req.user.organizationId?._id || req.user.organizationId
    }).select('-passwordHash').populate('organizationId', 'name slug tier');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found or does not belong to your organization.'
      });
    }

    res.json({
      success: true,
      data: user.toSafeObject()
    });
  } catch (err) {
    next(err);
  }
}

export async function createUser(req, res, next) {
  try {
    const { name, email, password, role = 'employee', title, accessScope } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required.'
      });
    }

    const normalizedRole = role.toLowerCase();
    if (!['admin', 'manager', 'employee'].includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified.'
      });
    }

    // Permission check: Only Admin can create Admin or Manager
    if (req.user.role !== 'admin' && (normalizedRole === 'admin' || normalizedRole === 'manager')) {
      return res.status(403).json({
        success: false,
        message: 'Only organization administrators can provision admin or manager accounts.'
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    const defaultPassword = password && password.length >= 8 ? password : 'TempPassword123!';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: normalizedRole,
      organizationId: req.user.organizationId?._id || req.user.organizationId,
      title: title || (normalizedRole === 'admin' ? 'Administrator' : normalizedRole === 'manager' ? 'Department Manager' : 'Team Member'),
      isActive: true,
      avatar: `https://images.unsplash.com/photo-${1535713875002 + Math.floor(Math.random() * 1000)}?w=150&auto=format&fit=crop&q=80`
    });

    await createAuditLog({
      req,
      action: 'USER_CREATED',
      resourceType: 'USER',
      resourceId: String(newUser._id),
      resourceName: newUser.name,
      result: 'allowed',
      details: `Created new user '${newUser.name}' with role '${newUser.role}' in organization`
    });

    const populated = await User.findById(newUser._id).select('-passwordHash').populate('organizationId', 'name slug tier');

    res.status(201).json({
      success: true,
      data: populated.toSafeObject(),
      message: 'User created successfully.'
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { name, role, title, isActive } = req.body;

    const user = await User.findOne({
      _id: id,
      organizationId: req.user.organizationId?._id || req.user.organizationId
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in your organization.'
      });
    }

    // Prevent privilege escalation: only Admin can change roles
    if (role && role.toLowerCase() !== user.role) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only administrators are authorized to alter user roles.'
        });
      }

      // Prevent demoting the last active administrator
      if (user.role === 'admin' && role.toLowerCase() !== 'admin') {
        const adminCount = await User.countDocuments({
          organizationId: user.organizationId,
          role: 'admin',
          isActive: true
        });
        if (adminCount <= 1) {
          return res.status(400).json({
            success: false,
            message: 'Cannot demote the last active administrator for this organization.'
          });
        }
      }

      user.role = role.toLowerCase();
    }

    // Prevent deactivating the last active administrator
    if (isActive === false && user.role === 'admin') {
      const activeAdminCount = await User.countDocuments({
        organizationId: user.organizationId,
        role: 'admin',
        isActive: true
      });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate the sole active administrator for this organization.'
        });
      }
    }

    if (name) user.name = name.trim();
    if (title !== undefined) user.title = title.trim();
    if (isActive !== undefined) user.isActive = Boolean(isActive);

    await user.save();

    await createAuditLog({
      req,
      action: 'USER_UPDATED',
      resourceType: 'USER',
      resourceId: String(user._id),
      resourceName: user.name,
      result: 'allowed',
      details: `Updated user profile (Role: ${user.role}, Status: ${user.isActive ? 'Active' : 'Inactive'})`
    });

    const populated = await User.findById(user._id).select('-passwordHash').populate('organizationId', 'name slug tier');

    res.json({
      success: true,
      data: populated.toSafeObject(),
      message: 'User updated successfully.'
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    const user = await User.findOne({
      _id: id,
      organizationId: req.user.organizationId?._id || req.user.organizationId
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in your organization.'
      });
    }

    // Cannot delete oneself
    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own active administrator account.'
      });
    }

    // Prevent deleting the last active administrator
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({
        organizationId: user.organizationId,
        role: 'admin',
        isActive: true
      });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the sole administrator for this organization.'
        });
      }
    }

    // Soft-delete / deactivate or hard delete
    await User.findByIdAndDelete(id);

    await createAuditLog({
      req,
      action: 'USER_DELETED',
      resourceType: 'USER',
      resourceId: String(id),
      resourceName: user.name,
      result: 'allowed',
      details: `Removed user account '${user.name}' (${user.email})`
    });

    res.json({
      success: true,
      message: `User '${user.name}' removed successfully.`
    });
  } catch (err) {
    next(err);
  }
}
