const jwt = require('jsonwebtoken');
const { queryOne } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'isc2_islamabad_super_secret_jwt_key_2026_production';

/**
 * Verifies JWT from cookie or Authorization header
 */
async function authenticateToken(req, res, next) {
    let token = null;

    // 1. Prioritize Authorization header (handles all case variations)
    const authHeader = req.headers.authorization || req.headers.Authorization || req.headers['authorization'];
    if (authHeader && typeof authHeader === 'string') {
        const trimmed = authHeader.trim();
        if (/^Bearer\s+/i.test(trimmed)) {
            token = trimmed.replace(/^Bearer\s+/i, '').trim();
        } else {
            token = trimmed;
        }
    }

    // 2. Fallback to HTTP cookie if no valid header token present
    if (!token && req.cookies && req.cookies.token && req.cookies.token !== 'null' && req.cookies.token !== 'undefined' && req.cookies.token.trim() !== '') {
        token = req.cookies.token.trim();
    }

    // 3. Fallback to query parameter
    if (!token && req.query && req.query.token) {
        token = String(req.query.token).trim();
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await queryOne('SELECT id, email, isc2_number, role FROM users WHERE id = $1', [decoded.id]);

        if (!user) {
            return res.status(401).json({ success: false, message: 'User session invalid or user not found.' });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ success: false, message: 'Session expired or invalid token.' });
    }
}

/**
 * Restricts route access to ADMIN role
 */
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
    }
    next();
}

module.exports = {
    authenticateToken,
    requireAdmin,
    JWT_SECRET
};
