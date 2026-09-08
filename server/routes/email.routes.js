const express = require('express');
const router = express.Router();
const { queryAll, execute } = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { sendBroadcastEmail } = require('../services/email.service');

/**
 * POST /api/admin/email/test
 * Send a test email to admin
 */
router.post('/test', authenticateToken, requireAdmin, async (req, res, next) => {
    try {
        const { previewEmail, subject, messageBody } = req.body;

        if (!previewEmail || !subject || !messageBody) {
            return res.status(400).json({ success: false, message: 'Please provide recipient email, subject, and message body.' });
        }

        await sendBroadcastEmail([previewEmail], `[TEST PREVIEW] ${subject}`, messageBody, req.user.email);

        return res.json({
            success: true,
            message: `Test email successfully sent to ${previewEmail}!`
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/admin/email/broadcast
 * Broadcast email to all selected active members and record in email_logs
 */
router.post('/broadcast', authenticateToken, requireAdmin, async (req, res, next) => {
    try {
        const { recipients, subject, messageBody } = req.body;

        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({ success: false, message: 'Please select at least one recipient.' });
        }

        if (!subject || !messageBody) {
            return res.status(400).json({ success: false, message: 'Please enter both subject and message body.' });
        }

        // Send email
        await sendBroadcastEmail(recipients, subject, messageBody, req.user.email);

        // Record in email_logs
        await execute(`
            INSERT INTO email_logs (subject, message, recipient_count, sent_by)
            VALUES ($1, $2, $3, $4)
        `, [subject, messageBody, recipients.length, req.user.email]);

        return res.json({
            success: true,
            message: `Email "${subject}" successfully sent to ${recipients.length} members!`,
            recipientCount: recipients.length
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/admin/email/logs
 * Retrieve dispatch history
 */
router.get('/logs', authenticateToken, requireAdmin, async (req, res, next) => {
    try {
        const logs = await queryAll('SELECT * FROM email_logs ORDER BY id DESC LIMIT 50');
        return res.json({ success: true, logs });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
