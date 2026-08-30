const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db, getTodayString, calculateEndDate, getMemberStatus } = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * GET /api/admin/members
 * Query params: ?status=active|inactive|all&search=term
 */
router.get('/', authenticateToken, requireAdmin, (req, res, next) => {
    try {
        const { status, search } = req.query;
        let query = 'SELECT * FROM members ORDER BY id DESC';
        let members = db.prepare(query).all();

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
router.post('/', authenticateToken, requireAdmin, (req, res, next) => {
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
        const existing = db.prepare('SELECT id, member_id FROM members WHERE member_id = ? OR email = ?').get(cleanId || '___NONE___', cleanEmail);
        const finalMemberId = existing ? existing.member_id : (cleanId || `00033${Math.floor(1000 + Math.random() * 9000)}`);

        const createTx = db.transaction(() => {
            if (existing) {
                // Update existing member and activate term
                db.prepare(`
                    UPDATE members SET
                        name = ?,
                        email = ?,
                        chapter = ?,
                        role = ?,
                        company = ?,
                        job_title = ?,
                        specialisation = ?,
                        industry = ?,
                        certifications = ?,
                        working_groups = ?,
                        term_start_date = ?,
                        term_end_date = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `).run(
                    cleanName,
                    cleanEmail,
                    chapter || 'Pakistan Islamabad Chapter',
                    role || 'Member',
                    company || 'Not specified',
                    jobTitle || 'Member',
                    specialisation || 'Not specified',
                    industry || 'Not specified',
                    certsJson,
                    groupsJson,
                    startDate,
                    endDate,
                    existing.id
                );

                // Add period to history
                const maxPeriodRow = db.prepare('SELECT MAX(period_number) as maxP FROM membership_history WHERE member_id = ?').get(finalMemberId);
                const nextPeriod = (maxPeriodRow && maxPeriodRow.maxP ? maxPeriodRow.maxP : 0) + 1;

                db.prepare(`
                    INSERT INTO membership_history (member_id, period_number, start_date, end_date, status)
                    VALUES (?, ?, ?, ?, 'Active')
                `).run(finalMemberId, nextPeriod, startDate, endDate);
            } else {
                // Insert new member
                db.prepare(`
                    INSERT INTO members (
                        member_id, name, email, chapter, role, company, job_title,
                        specialisation, industry, certifications, working_groups,
                        term_start_date, term_end_date
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    finalMemberId,
                    cleanName,
                    cleanEmail,
                    chapter || 'Pakistan Islamabad Chapter',
                    role || 'Member',
                    company || 'Not specified',
                    jobTitle || 'Member',
                    specialisation || 'Not specified',
                    industry || 'Not specified',
                    certsJson,
                    groupsJson,
                    startDate,
                    endDate
                );

                db.prepare(`
                    INSERT INTO membership_history (member_id, period_number, start_date, end_date, status)
                    VALUES (?, 1, ?, ?, 'Active')
                `).run(finalMemberId, startDate, endDate);

                // Create login credentials for member
                const memberPassHash = bcrypt.hashSync('Password@123', 10);
                db.prepare(`
                    INSERT OR IGNORE INTO users (email, isc2_number, password_hash, role)
                    VALUES (?, ?, ?, 'MEMBER')
                `).run(cleanEmail, finalMemberId, memberPassHash);
            }

            // Remove any pending application for this email or ID
            db.prepare('DELETE FROM applications WHERE email = ? OR isc2_number = ?').run(cleanEmail, finalMemberId);
        });

        createTx();

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
router.get('/:id', authenticateToken, requireAdmin, (req, res, next) => {
    try {
        const memberId = req.params.id;
        const member = db.prepare('SELECT * FROM members WHERE member_id = ? OR id = ?').get(memberId, memberId);

        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found.' });
        }

        const history = db.prepare(`
            SELECT period_number as period, start_date as startDate, end_date as endDate, status
            FROM membership_history
            WHERE member_id = ?
            ORDER BY period_number ASC
        `).all(member.member_id);

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
router.post('/:id/reactivate', authenticateToken, requireAdmin, (req, res, next) => {
    try {
        const memberId = req.params.id;
        const member = db.prepare('SELECT * FROM members WHERE member_id = ? OR id = ?').get(memberId, memberId);

        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found.' });
        }

        const startDate = getTodayString();
        const endDate = calculateEndDate(startDate);

        const reactivateTx = db.transaction(() => {
            // 1. Update member active term
            db.prepare(`
                UPDATE members
                SET term_start_date = ?, term_end_date = ?, updated_at = CURRENT_TIMESTAMP
                WHERE member_id = ?
            `).run(startDate, endDate, member.member_id);

            // 2. Mark previous periods as expired
            db.prepare(`
                UPDATE membership_history
                SET status = 'Expired'
                WHERE member_id = ?
            `).run(member.member_id);

            // 3. Find next period number
            const lastPeriod = db.prepare(`
                SELECT MAX(period_number) as maxPeriod FROM membership_history WHERE member_id = ?
            `).get(member.member_id);

            const nextPeriod = (lastPeriod && lastPeriod.maxPeriod ? lastPeriod.maxPeriod : 0) + 1;

            // 4. Insert new active period
            db.prepare(`
                INSERT INTO membership_history (member_id, period_number, start_date, end_date, status)
                VALUES (?, ?, ?, ?, 'Active')
            `).run(member.member_id, nextPeriod, startDate, endDate);
        });

        reactivateTx();

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
router.post('/bulk-reactivate', authenticateToken, requireAdmin, (req, res, next) => {
    try {
        const { memberIds } = req.body;

        if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide an array of member IDs to reactivate.' });
        }

        const startDate = getTodayString();
        const endDate = calculateEndDate(startDate);

        const bulkTx = db.transaction((ids) => {
            for (const id of ids) {
                const member = db.prepare('SELECT * FROM members WHERE member_id = ? OR id = ?').get(id, id);
                if (!member) continue;

                db.prepare(`
                    UPDATE members
                    SET term_start_date = ?, term_end_date = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE member_id = ?
                `).run(startDate, endDate, member.member_id);

                db.prepare(`
                    UPDATE membership_history
                    SET status = 'Expired'
                    WHERE member_id = ?
                `).run(member.member_id);

                const lastPeriod = db.prepare(`
                    SELECT MAX(period_number) as maxPeriod FROM membership_history WHERE member_id = ?
                `).get(member.member_id);

                const nextPeriod = (lastPeriod && lastPeriod.maxPeriod ? lastPeriod.maxPeriod : 0) + 1;

                db.prepare(`
                    INSERT INTO membership_history (member_id, period_number, start_date, end_date, status)
                    VALUES (?, ?, ?, ?, 'Active')
                `).run(member.member_id, nextPeriod, startDate, endDate);
            }
        });

        bulkTx(memberIds);

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
