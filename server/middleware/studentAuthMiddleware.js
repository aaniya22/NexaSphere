import { studentAuthService } from '../services/studentAuthService.js';
import crypto from 'crypto';

// Exporting utility specifically for standardizing timing-safe checks across modules
export function safeCompareTokens(a, b) {
  if (!a || !b) return false;
  const hashA = crypto.createHash('sha256').update(String(a)).digest();
  const hashB = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export function requireStudentAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  if (!token && req.cookies?.ns_student_token) {
    token = req.cookies.ns_student_token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Token is verified inside the service securely
  const payload = studentAuthService.verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.studentUser = payload;
  next();
}

export function requireStudentScope(requiredScope) {
  return (req, res, next) => {
    if (!req.studentUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const scopes = req.studentUser.scopes || [];
    if (!scopes.includes(requiredScope)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}
