import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export async function authenticate(req, res, next) {
  try {
    let token = null;

    // Check 1: HttpOnly cookie
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Check 2: Bearer Authorization header
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No session or access token provided.'
      });
    }

    const secret = process.env.JWT_SECRET || 'securerag_jwt_super_secret_enterprise_token_key_2026_xyz!@#';
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please sign in again.'
      });
    }

    const user = await User.findById(decoded.id).populate('organizationId', 'name slug tier isActive');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user account associated with this token no longer exists.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact your organization administrator.'
      });
    }

    // Attach validated user to request
    req.user = user;
    req.userOrganization = user.organizationId;
    next();
  } catch (err) {
    next(err);
  }
}
