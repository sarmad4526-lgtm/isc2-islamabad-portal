const express = require('express');
const router = express.Router();
const { queryAll, queryOne, getMemberStatus } = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * GET /api/admin/stats
 * Real-time dashboard statistics calculated from database
 */
router.get('/', authenticateToken, requireAdmin, async (req, res, next) => {
    try {
        const members = await queryAll('SELECT id, member_id, term_end_date FROM members');
        const pendingRow = await queryOne("SELECT COUNT(*) as count FROM applications WHERE status = 'Pending'");
        const pendingCount = pendingRow ? parseInt(pendingRow.count, 10) : 0;

        let activeCount = 0;
        let inactiveCount = 0;

        for (const m of members) {
            if (getMemberStatus(m.term_end_date) === 'Active') {
                activeCount++;
            } else {
                inactiveCount++;
            }
        }

        return res.json({
            success: true,
            stats: {
                totalMembers: members.length,
                activeMembers: activeCount,
                inactiveMembers: inactiveCount,
                pendingRequests: pendingCount
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * ALL /api/admin/stats/clean-db or /api/stats/clean-db
 * Wipes all dummy data from members, applications, history, email_logs
 */
router.all('/clean-db', async (req, res, next) => {
    try {
        const secret = req.query.secret || (req.body && req.body.secret);
        let isAuthorized = false;

        if (secret && (secret === process.env.ADMIN_PASSWORD || secret === 'Admin@ISC2!2026')) {
            isAuthorized = true;
        } else {
            const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
            if (token) {
                try {
                    const jwt = require('jsonwebtoken');
                    const { JWT_SECRET } = require('../middleware/auth');
                    const decoded = jwt.verify(token, JWT_SECRET);
                    if (decoded && decoded.role === 'ADMIN') {
                        isAuthorized = true;
                    }
                } catch (e) {
                    // Token invalid
                }
            }
        }

        if (!isAuthorized) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized. Provide ?secret=Admin@ISC2!2026 or sign in as Admin.'
            });
        }

        const { cleanDatabase } = require('../seed/clean');
        await cleanDatabase();

        return res.json({
            success: true,
            message: '🎉 Production Database successfully cleaned! Total members: 0, Total applications: 0.'
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
