const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { queryAll, queryOne, execute, transaction, getTodayString, calculateEndDate, getMemberStatus } = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * GET /api/admin/members
 * Query params: ?status=active|inactive|all&search=term
 */
router.get('/', authenticateToken, requireAdmin, async (req, res, next) => {
    try {
        const { status, search } = req.query;
        let members = await queryAll('SELECT * FROM members ORDER BY id DESC');

        // Parse JSON fields and dynamic status
        members = members.map(m => {
            const dynamicStatus = getMemberStatus(m.term_end_date);
            return {
                ...m,
                memberId: m.member_id,
                termStartDate: m.term_start_date,
                termEndDate: m.term_end_date,
                jobTitle: m.job_title,
                workingGroups: JSON.parse(m.working_groups || '[]'),
                certifications: JSON.parse(m.certifications || '[]'),
                status: dynamicStatus
            };
        });

        // Filter by status if requested
        if (status === 'active') {
            members = members.filter(m => m.status === 'Active');
        } else if (status === 'inactive') {
            members = members.filter(m => m.status === 'Inactive');
        }

        // Search filter
        if (search) {
            const term = search.toLowerCase();
            members = members.filter(m => 
                m.name.toLowerCase().includes(term) ||
                m.email.toLowerCase().includes(term) ||
                m.memberId.includes(term) ||
                (m.company && m.company.toLowerCase().includes(term)) ||
                (m.jobTitle && m.jobTitle.toLowerCase().includes(term))
            );
        }

        return res.json({
            success: true,
            count: members.length,
            members
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/admin/members
 * Creates a new member directly from admin dashboard
 */
router.post('/', authenticateToken, requireAdmin, async (req, res, next) => {
    try {
        const {
            memberId,
            name,
            email,
            chapter,
            role,
            company,
            jobTitle,
            specialisation,
            industry,
            country,
            city,
            certifications,
            workingGroups,
            termStartDate,
            termEndDate
        } = req.body;

        if (!name || !email) {
            return res.status(400).json({ success: false, message: 'Name and Email are required.' });
        }

        const cleanId = memberId ? String(memberId).trim().replace(/\D/g, '') : '';
        const startDate = termStartDate || getTodayString();
        const endDate = termEndDate || calculateEndDate(startDate);
        const certsJson = JSON.stringify(Array.isArray(certifications) ? certifications : []);
        const groupsJson = JSON.stringify(Array.isArray(workingGroups) ? workingGroups : []);
        const cleanEmail = email.trim().toLowerCase();
        const cleanName = name.trim();

        // Check if member already exists
        const existing = await queryOne(
            'SELECT id, member_id FROM members WHERE member_id = $1 OR email = $2',
            [cleanId || '___NONE___', cleanEmail]
        );
        const finalMemberId = existing ? existing.member_id : (cleanId || `00033${Math.floor(1000 + Math.random() * 9000)}`);

        await transaction(async (tx) => {
            if (existing) {
                // Update existing member and activate term
                await tx.execute(`
                    UPDATE members SET
                        name = $1,
                        email = $2,
                        chapter = $3,
                        role = $4,
                        company = $5,
                        job_title = $6,
                        specialisation = $7,
                        industry = $8,
                        country = $9,
                        city = $10,
                        certifications = $11,
                        working_groups = $12,
                        term_start_date = $13,
                        term_end_date = $14,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $15
                `, [
                    cleanName, cleanEmail,
                    chapter || 'Pakistan Islamabad Chapter',
                    role || 'Member',
                    company || 'Not specified',
                    jobTitle || 'Member',
                    specialisation || 'Not specified',
                    industry || 'Not specified',
                    country || 'Not specified',
                    city || 'Not specified',
                    certsJson, groupsJson,
                    startDate, endDate,
                    existing.id
                ]);

                // Add period to history
                const maxPeriodRow = await tx.queryOne(
                    'SELECT MAX(period_number) as maxp FROM membership_history WHERE member_id = $1',
                    [finalMemberId]
                );
                const nextPeriod = (maxPeriodRow && maxPeriodRow.maxp ? parseInt(maxPeriodRow.maxp, 10) : 0) + 1;

                await tx.execute(`
                    INSERT INTO membership_history (member_id, period_number, start_date, end_date, status)
                    VALUES ($1, $2, $3, $4, 'Active')
                `, [finalMemberId, nextPeriod, startDate, endDate]);
            } else {
                // Insert new member
                await tx.execute(`
                    INSERT INTO members (
                        member_id, name, email, chapter, role, company, job_title,
                        specialisation, industry, country, city, certifications, working_groups,
                        term_start_date, term_end_date
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                `, [
                    finalMemberId, cleanName, cleanEmail,
                    chapter || 'Pakistan Islamabad Chapter',
                    role || 'Member',
                    company || 'Not specified',
                    jobTitle || 'Member',
                    specialisation || 'Not specified',
                    industry || 'Not specified',
                    country || 'Not specified',
                    city || 'Not specified',
                    certsJson, groupsJson,
                    startDate, endDate
                ]);

                await tx.execute(`
                    INSERT INTO membership_history (member_id, period_number, start_date, end_date, status)
                    VALUES ($1, 1, $2, $3, 'Active')
                `, [finalMemberId, startDate, endDate]);

                // Create login credentials for member
                const memberPassHash = bcrypt.hashSync('Password@123', 10);
                // Use ON CONFLICT for Postgres, INSERT OR IGNORE handled by SQLite conversion
                await tx.execute(`
                    INSERT INTO users (email, isc2_number, password_hash, role)
                    VALUES ($1, $2, $3, 'MEMBER')
                    ON CONFLICT DO NOTHING
                `, [cleanEmail, finalMemberId, memberPassHash]);
            }

            // Remove any pending application for this email or ID
            await tx.execute(
                'DELETE FROM applications WHERE email = $1 OR isc2_number = $2',
                [cleanEmail, finalMemberId]
            );
        });

        const createdMember = {
            memberId: finalMemberId,
            name: cleanName,
            email: cleanEmail,
            chapter: chapter || 'Pakistan Islamabad Chapter',
            role: role || 'Member',
            company: company || 'Not specified',
            jobTitle: jobTitle || 'Member',
            specialisation: specialisation || 'Not specified',
            industry: industry || 'Not specified',
            country: country || 'Not specified',
            city: city || 'Not specified',
            certifications: Array.isArray(certifications) ? certifications : [],
            workingGroups: Array.isArray(workingGroups) ? workingGroups : [],
            termStartDate: startDate,
            termEndDate: endDate,
            status: 'Active',
            history: [{ period: 1, startDate, endDate, status: 'Active' }]
        };

        return res.status(201).json({
            success: true,
            message: `Member ${cleanName} (ID: ${finalMemberId}) successfully registered and added to Active Members!`,
            member: createdMember
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/admin/members/:id
 * Fetches member profile with full membership history
 */
router.get('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
    try {
        const memberId = req.params.id;
        const member = await queryOne(
            'SELECT * FROM members WHERE member_id = $1 OR id = $2',
            [memberId, isNaN(memberId) ? -1 : parseInt(memberId, 10)]
        );

        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found.' });
        }

        const history = await queryAll(`
            SELECT period_number as period, start_date as "startDate", end_date as "endDate", status
            FROM membership_history
            WHERE member_id = $1
            ORDER BY period_number ASC
        `, [member.member_id]);

        const dynamicStatus = getMemberStatus(member.term_end_date);

        return res.json({
            success: true,
            member: {
                ...member,
                memberId: member.member_id,
                termStartDate: member.term_start_date,
                termEndDate: member.term_end_date,
                jobTitle: member.job_title,
                workingGroups: JSON.parse(member.working_groups || '[]'),
                certifications: JSON.parse(member.certifications || '[]'),
                status: dynamicStatus,
                history
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/admin/members/:id/reactivate
 * Single member reactivation for 1 year from current date
 */
router.post('/:id/reactivate', authenticateToken, requireAdmin, async (req, res, next) => {
    try {
        const memberId = req.params.id;
        const member = await queryOne(
            'SELECT * FROM members WHERE member_id = $1 OR id = $2',
            [memberId, isNaN(memberId) ? -1 : parseInt(memberId, 10)]
        );

        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found.' });
        }

        const startDate = getTodayString();
        const endDate = calculateEndDate(startDate);

        await transaction(async (tx) => {
            // 1. Update member active term
            await tx.execute(`
                UPDATE members
                SET term_start_date = $1, term_end_date = $2, updated_at = CURRENT_TIMESTAMP
                WHERE member_id = $3
            `, [startDate, endDate, member.member_id]);

            // 2. Mark previous periods as expired
            await tx.execute(`
                UPDATE membership_history
                SET status = 'Expired'
                WHERE member_id = $1
            `, [member.member_id]);

            // 3. Find next period number
            const lastPeriod = await tx.queryOne(`
                SELECT MAX(period_number) as maxperiod FROM membership_history WHERE member_id = $1
            `, [member.member_id]);

            const nextPeriod = (lastPeriod && lastPeriod.maxperiod ? parseInt(lastPeriod.maxperiod, 10) : 0) + 1;

            // 4. Insert new active period
            await tx.execute(`
                INSERT INTO membership_history (member_id, period_number, start_date, end_date, status)
                VALUES ($1, $2, $3, $4, 'Active')
            `, [member.member_id, nextPeriod, startDate, endDate]);
        });

        return res.json({
            success: true,
            message: `Member ${member.name} (ID: ${member.member_id}) successfully reactivated for 1 year!`,
            termStartDate: startDate,
            termEndDate: endDate
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/admin/members/bulk-reactivate
 * Batch reactivates an array of inactive member IDs
 */
router.post('/bulk-reactivate', authenticateToken, requireAdmin, async (req, res, next) => {
    try {
        const { memberIds } = req.body;

        if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide an array of member IDs to reactivate.' });
        }

        const startDate = getTodayString();
        const endDate = calculateEndDate(startDate);

        await transaction(async (tx) => {
            for (const id of memberIds) {
                const member = await tx.queryOne(
                    'SELECT * FROM members WHERE member_id = $1 OR id = $2',
                    [String(id), isNaN(id) ? -1 : parseInt(id, 10)]
                );
                if (!member) continue;

                await tx.execute(`
                    UPDATE members
                    SET term_start_date = $1, term_end_date = $2, updated_at = CURRENT_TIMESTAMP
                    WHERE member_id = $3
                `, [startDate, endDate, member.member_id]);

                await tx.execute(`
                    UPDATE membership_history
                    SET status = 'Expired'
                    WHERE member_id = $1
                `, [member.member_id]);

                const lastPeriod = await tx.queryOne(`
                    SELECT MAX(period_number) as maxperiod FROM membership_history WHERE member_id = $1
                `, [member.member_id]);

                const nextPeriod = (lastPeriod && lastPeriod.maxperiod ? parseInt(lastPeriod.maxperiod, 10) : 0) + 1;

                await tx.execute(`
                    INSERT INTO membership_history (member_id, period_number, start_date, end_date, status)
                    VALUES ($1, $2, $3, $4, 'Active')
                `, [member.member_id, nextPeriod, startDate, endDate]);
            }
        });

        return res.json({
            success: true,
            message: `Successfully batch-reactivated ${memberIds.length} members!`,
            termStartDate: startDate,
            termEndDate: endDate
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
