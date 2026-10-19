import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { createAuditLog } from '../utils/auditService.js';

function generateToken(user) {
  const secret = process.env.JWT_SECRET || 'securerag_jwt_super_secret_enterprise_token_key_2026_xyz!@#';
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId?._id || user.organizationId
    },
    secret,
    { expiresIn: '7d' }
  );
}

function setTokenCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).populate(
      'organizationId',
      'name slug tier isActive'
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Record failed login audit
      await createAuditLog({
        req,
        organizationId: user.organizationId?._id || user.organizationId,
        actorId: user._id,
        actorName: user.name,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'LOGIN_FAILED',
        resourceType: 'AUTH',
        resourceId: String(user._id),
        result: 'denied',
        details: 'Failed login attempt: Incorrect password'
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact your organization administrator.'
      });
    }

    // Update lastLoginAt
    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user);
    setTokenCookie(res, token);

    // Record successful login audit
    await createAuditLog({
      req,
      organizationId: user.organizationId?._id || user.organizationId,
      actorId: user._id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'LOGIN_SUCCESS',
      resourceType: 'AUTH',
      resourceId: String(user._id),
      result: 'allowed',
      details: `Successful authenticated login session established for role '${user.role}'`
    });

    res.json({
      success: true,
      token,
      user: user.toSafeObject()
    });
  } catch (err) {
    next(err);
  }
}

export async function register(req, res, next) {
  try {
    const { name, email, password, organizationSlug } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    // Resolve target organization
    let org = null;
    if (organizationSlug) {
      org = await Organization.findOne({ slug: organizationSlug.toLowerCase().trim() });
    }
    if (!org) {
      org = await Organization.findOne({ isActive: true });
    }

    if (!org) {
      return res.status(400).json({
        success: false,
        message: 'No active organization found to attach user account.'
      });
    }

    // Security rule: Public registration CANNOT grant admin or manager role
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'employee', // Always default to employee for public registrations
      organizationId: org._id,
      title: 'Member',
      isActive: true,
      lastLoginAt: new Date()
    });

    const populatedUser = await User.findById(newUser._id).populate('organizationId', 'name slug tier isActive');
    const token = generateToken(populatedUser);
    setTokenCookie(res, token);

    await createAuditLog({
      req,
      organizationId: org._id,
      actorId: newUser._id,
      actorName: newUser.name,
      actorEmail: newUser.email,
      actorRole: 'employee',
      action: 'USER_REGISTERED',
      resourceType: 'AUTH',
      resourceId: String(newUser._id),
      result: 'allowed',
      details: 'New user registered via public portal'
    });

    res.status(201).json({
      success: true,
      token,
      user: populatedUser.toSafeObject()
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    res.json({
      success: true,
      user: req.user.toSafeObject()
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    if (req.user) {
      await createAuditLog({
        req,
        action: 'LOGOUT',
        resourceType: 'AUTH',
        resourceId: String(req.user._id),
        result: 'allowed',
        details: 'User explicitly logged out session'
      });
    }

    res.clearCookie('token', {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      secure: process.env.NODE_ENV === 'production'
    });

    res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (err) {
    next(err);
  }
}
