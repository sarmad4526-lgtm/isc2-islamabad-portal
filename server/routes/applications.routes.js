const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { queryAll, queryOne, execute, transaction, getTodayString, calculateEndDate } = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { sendApplicationReceivedEmail, sendApplicationApprovedEmail } = require('../services/email.service');

/**
 * POST /api/membership/apply
 * Public endpoint for new membership registration
 */
router.post('/apply', async (req, res, next) => {
    try {
        const {
            email,
            firstName,
            lastName,
            isc2Number,
            jobTitle,
            specialisation,
            industry,
            country,
            city,
            certifications,
            workingGroups
        } = req.body;

        if (!email || !firstName || !lastName || !isc2Number) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields: Email, First Name, Last Name, and numeric ISC2 Membership Number.' });
        }

        const cleanIsc2 = String(isc2Number).trim().replace(/\D/g, '');
        if (!cleanIsc2 || !/^\d+$/.test(cleanIsc2)) {
            return res.status(400).json({ success: false, message: 'ISC2 Membership Number must contain digits only (no letters or special characters).' });
        }

        // Check if member with this ISC2 number already exists
        const existingMember = await queryOne('SELECT id FROM members WHERE member_id = $1', [cleanIsc2]);
        if (existingMember) {
            return res.status(400).json({ success: false, message: `A member with ISC2 ID ${cleanIsc2} is already registered in the chapter.` });
        }

        // Check if request with this ISC2 number is already pending
        const existingApp = await queryOne("SELECT id FROM applications WHERE isc2_number = $1 AND status = 'Pending'", [cleanIsc2]);
        if (existingApp) {
            return res.status(400).json({ success: false, message: `An application with ISC2 ID ${cleanIsc2} is already pending review.` });
        }

        const fullName = `${firstName} ${lastName}`.trim();
        const todayStr = getTodayString();
        
        // Generate Request Reference ID
        const countRow = await queryOne('SELECT COUNT(*) as count FROM applications');
        const count = countRow ? parseInt(countRow.count, 10) : 0;
        const requestId = `REQ-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

        const certsJson = JSON.stringify(Array.isArray(certifications) ? certifications : []);
        const groupsJson = JSON.stringify(Array.isArray(workingGroups) ? workingGroups : []);

        await execute(`
            INSERT INTO applications (
                request_id, isc2_number, name, email, company, job_title,
                specialisation, industry, country, city, certifications, working_groups, status, date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Pending', $13)
        `, [
            requestId,
            cleanIsc2,
            fullName,
            email.trim().toLowerCase(),
            industry || 'Not specified',
            jobTitle || 'Member',
            specialisation || 'Not specified',
            industry || 'Not specified',
            country || 'Not specified',
            city || 'Not specified',
            certsJson,
            groupsJson,
            todayStr
        ]);

        const newApp = {
            requestId,
            isc2Number: cleanIsc2,
            name: fullName,
            email: email.trim(),
            date: todayStr
        };

        // Trigger transactional acknowledgment email
        sendApplicationReceivedEmail(newApp).catch(console.error);

        return res.status(201).json({
            success: true,
            message: `Thank you ${firstName}! Your application (Reference: ${requestId}) with ISC2 Member ID [${cleanIsc2}] has been submitted for review.`,
            requestId,
            isc2Number: cleanIsc2
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/admin/applications
 * Admin endpoint to list all pending applications
 */
router.get('/', authenticateToken, requireAdmin, async (req, res, next) => {
    try {
        const applications = await queryAll("SELECT * FROM applications WHERE status = 'Pending' ORDER BY id DESC");

        const formatted = applications.map(app => ({
            id: app.id,
            requestId: app.request_id,
            isc2Number: app.isc2_number,
            name: app.name,
            email: app.email,
            company: app.company,
            jobTitle: app.job_title,
            specialisation: app.specialisation,
            industry: app.industry,
            country: app.country,
            city: app.city,
            certifications: JSON.parse(app.certifications || '[]'),
            workingGroups: JSON.parse(app.working_groups || '[]'),
            date: app.date,
            status: app.status
        }));

        return res.json({
            success: true,
            count: formatted.length,
            applications: formatted
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/admin/applications/:id/approve
 * Approves application, creates Active Member with self-assigned ISC2 ID, and records 1-year term
 */
router.post('/:id/approve', authenticateToken, requireAdmin, async (req, res, next) => {
    try {
        const appId = req.params.id;
        const app = await queryOne(
            'SELECT * FROM applications WHERE request_id = $1 OR id = $2',
            [appId, isNaN(appId) ? -1 : parseInt(appId, 10)]
        );

        if (!app) {
            return res.status(404).json({ success: false, message: 'Application not found.' });
        }

        if (app.status !== 'Pending') {
            return res.status(400).json({ success: false, message: `Application is already ${app.status}.` });
        }

        const cleanIsc2 = app.isc2_number.replace(/\D/g, '');
        const startDate = getTodayString();
        const endDate = calculateEndDate(startDate);

        try {
            await transaction(async (tx) => {
                // 1. Insert into members table using self-assigned ISC2 Number as member_id
                await tx.execute(`
                    INSERT INTO members (
                        member_id, name, email, chapter, role, company, job_title,
                        specialisation, industry, country, city, certifications, working_groups,
                        term_start_date, term_end_date
                    ) VALUES ($1, $2, $3, 'Pakistan Islamabad Chapter', 'Member', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                `, [
                    cleanIsc2,
                    app.name,
                    app.email,
                    app.company,
                    app.job_title,
                    app.specialisation,
                    app.industry,
                    app.country,
                    app.city,
                    app.certifications,
                    app.working_groups,
                    startDate,
                    endDate
                ]);

                // 2. Insert initial membership history period 1
                await tx.execute(`
                    INSERT INTO membership_history (member_id, period_number, start_date, end_date, status)
                    VALUES ($1, 1, $2, $3, 'Active')
                `, [cleanIsc2, startDate, endDate]);

                // 3. Create or update user login credentials
                const memberPassHash = bcrypt.hashSync('Password@123', 10);
                await tx.execute(`
                    INSERT INTO users (email, isc2_number, password_hash, role)
                    VALUES ($1, $2, $3, 'MEMBER')
                    ON CONFLICT DO NOTHING
                `, [app.email, cleanIsc2, memberPassHash]);

                // 4. Mark application as Approved
                await tx.execute("UPDATE applications SET status = 'Approved' WHERE id = $1", [app.id]);
            });
        } catch (txErr) {
            if (txErr.message && txErr.message.includes('unique') && txErr.message.includes('email')) {
                return res.status(409).json({
                    success: false,
                    message: `A member with the email "${app.email}" is already registered. This application cannot be approved again.`
                });
            }
            if (txErr.message && txErr.message.includes('unique') && txErr.message.includes('member_id')) {
                return res.status(409).json({
                    success: false,
                    message: `A member with ISC2 ID ${cleanIsc2} already exists. This application cannot be approved again.`
                });
            }
            throw txErr;
        }

        const createdMember = {
            memberId: cleanIsc2,
            name: app.name,
            email: app.email,
            termStartDate: startDate,
            termEndDate: endDate
        };

        // Dispatch approval email
        sendApplicationApprovedEmail(createdMember).catch(console.error);

        return res.json({
            success: true,
            message: `Application for ${app.name} approved! Member is now active with ISC2 ID ${cleanIsc2}.`,
            member: createdMember
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/admin/applications/:id/reject
 * Rejects application
 */
router.post('/:id/reject', authenticateToken, requireAdmin, async (req, res, next) => {
    try {
        const appId = req.params.id;
        const app = await queryOne(
            'SELECT * FROM applications WHERE request_id = $1 OR id = $2',
            [appId, isNaN(appId) ? -1 : parseInt(appId, 10)]
        );

        if (!app) {
            return res.status(404).json({ success: false, message: 'Application not found.' });
        }

        await execute("UPDATE applications SET status = 'Rejected' WHERE id = $1", [app.id]);

        return res.json({
            success: true,
            message: `Application ${app.request_id} for ${app.name} has been rejected.`
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
