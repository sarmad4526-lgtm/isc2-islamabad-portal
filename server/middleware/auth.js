const jwt = require('jsonwebtoken');
const { queryOne } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'isc2_islamabad_super_secret_jwt_key_2026_production';

/**
 * Verifies JWT from cookie or Authorization header
 */
async function authenticateToken(req, res, next) {
    let token = null;

    // Check HTTP-only cookie first
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    } 
    // Fallback to Bearer token in header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        // Development mode convenience: fallback to admin account for seamless local testing
        if (process.env.NODE_ENV !== 'production') {
            const devAdmin = await queryOne("SELECT id, email, isc2_number, role FROM users WHERE role = 'ADMIN' LIMIT 1");
            if (devAdmin) {
                req.user = devAdmin;
                return next();
            }
        }
        return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await queryOne('SELECT id, email, isc2_number, role FROM users WHERE id = $1', [decoded.id]);

        if (!user) {
            if (process.env.NODE_ENV !== 'production') {
                const devAdmin = await queryOne("SELECT id, email, isc2_number, role FROM users WHERE role = 'ADMIN' LIMIT 1");
                if (devAdmin) {
                    req.user = devAdmin;
                    return next();
                }
            }
            return res.status(401).json({ success: false, message: 'User session invalid or user not found.' });
        }

        req.user = user;
        next();
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            const devAdmin = await queryOne("SELECT id, email, isc2_number, role FROM users WHERE role = 'ADMIN' LIMIT 1");
            if (devAdmin) {
                req.user = devAdmin;
                return next();
            }
        }
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
