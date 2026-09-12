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
 * Admin-only database cleanup utility
 */
router.all('/clean-db', authenticateToken, requireAdmin, async (req, res, next) => {
    try {
        const { cleanDatabase } = require('../seed/clean');
        await cleanDatabase();

        return res.json({
            success: true,
            message: 'Database clean completed.'
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
