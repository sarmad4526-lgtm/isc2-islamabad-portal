const express = require('express');
const router = express.Router();
const { db, getTodayString, getMemberStatus } = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * GET /api/admin/stats
 * Real-time dashboard statistics calculated from database
 */
router.get('/', authenticateToken, requireAdmin, (req, res, next) => {
    try {
        const members = db.prepare('SELECT id, member_id, term_end_date FROM members').all();
        const pendingCount = db.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'Pending'").get().count;

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

module.exports = router;
