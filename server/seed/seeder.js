require('dotenv').config();
const bcrypt = require('bcryptjs');
const { queryOne, execute, transaction, initDb, getMemberStatus } = require('../config/db');

const SEED_MEMBERS = [
    {
        memberId: "000335888",
        name: "Asim Husain",
        email: "asim.h@isc2islamabad.org",
        chapter: "Pakistan Islamabad Chapter",
        role: "Member",
        company: "National Cyber Security Hub",
        jobTitle: "Lead Security Architect",
        specialisation: "Secure System Architecture & Design",
        industry: "Telecommunications, Technology, Internet & Electronics",
        certifications: ["CISSP", "ISSAP"],
        workingGroups: ["Cloud Security"],
        termStartDate: "2013-07-17",
        termEndDate: "2023-12-31",
        history: [
            { period: 1, startDate: "2013-07-17", endDate: "2023-12-31", status: "Expired" }
        ]
    },
    {
        memberId: "000335889",
        name: "Tanveer Ahmad",
        email: "tanveer.a@isc2islamabad.org",
        chapter: "Pakistan Islamabad Chapter",
        role: "Member",
        company: "Federal Tech Innovations",
        jobTitle: "Governance & Risk Manager",
        specialisation: "Cyber Security Governance & Risk Management",
        industry: "Government",
        certifications: ["CGRC", "CISSP"],
        workingGroups: ["DevSecOps"],
        termStartDate: "2017-02-11",
        termEndDate: "2024-02-10",
        history: [
            { period: 1, startDate: "2017-02-11", endDate: "2024-02-10", status: "Expired" }
        ]
    },
    {
        memberId: "000335890",
        name: "Hamid Ali",
        email: "hamid.a@isc2islamabad.org",
        chapter: "Pakistan Islamabad Chapter",
        role: "Member",
        company: "Nexus Defense Systems",
        jobTitle: "SOC Analyst",
        specialisation: "Network Monitoring and Intrusion Detection",
        industry: "Airlines & Aerospace (including Defense)",
        certifications: ["SSCP"],
        workingGroups: ["Cloud Security"],
        termStartDate: "2022-10-27",
        termEndDate: "2024-10-27",
        history: [
            { period: 1, startDate: "2022-10-27", endDate: "2024-10-27", status: "Expired" }
        ]
    },
    {
        memberId: "000335891",
        name: "Jawwad Shamsi",
        email: "jawwad.s@isc2islamabad.org",
        chapter: "Pakistan Islamabad Chapter",
        role: "Member",
        company: "FAST-NUCES Islamabad",
        jobTitle: "Professor & Cyber Security Advisor",
        specialisation: "Secure System Development",
        industry: "Education",
        certifications: ["CISSP", "CSSLP"],
        workingGroups: ["DevSecOps"],
        termStartDate: "2025-09-23",
        termEndDate: "2026-09-22",
        history: [
            { period: 1, startDate: "2025-09-23", endDate: "2026-09-22", status: "Active" }
        ]
    },
    {
        memberId: "000335892",
        name: "Muhammad Irfan Khokhar",
        email: "irfan.k@isc2islamabad.org",
        chapter: "Pakistan Islamabad Chapter",
        role: "Member",
        company: "Global Digital Trust",
        jobTitle: "Principal Security Consultant",
        specialisation: "Cyber Threat Intelligence",
        industry: "Finance & Financial Services",
        certifications: ["CISSP", "ISSMP"],
        workingGroups: ["Cloud Security", "DevSecOps"],
        termStartDate: "2025-09-18",
        termEndDate: "2026-09-17",
        history: [
            { period: 1, startDate: "2025-09-18", endDate: "2026-09-17", status: "Active" }
        ]
    },
    {
        memberId: "000335893",
        name: "Hassan Jalil Hadi",
        email: "hassan.h@isc2islamabad.org",
        chapter: "Pakistan Islamabad Chapter",
        role: "Member",
        company: "TechSecure PK",
        jobTitle: "Cloud Architect",
        specialisation: "Secure System Architecture & Design",
        industry: "Telecommunications, Technology, Internet & Electronics",
        certifications: ["CCSP"],
        workingGroups: ["Cloud Security"],
        termStartDate: "2026-01-29",
        termEndDate: "2027-01-29",
        history: [
            { period: 1, startDate: "2026-01-29", endDate: "2027-01-29", status: "Active" }
        ]
    },
    {
        memberId: "000335894",
        name: "Mr Ali",
        email: "ali.m@isc2islamabad.org",
        chapter: "Pakistan Islamabad Chapter",
        role: "Member",
        company: "Islamabad Telecom Group",
        jobTitle: "Data Protection Officer",
        specialisation: "Data Protection & Privacy",
        industry: "Telecommunications, Technology, Internet & Electronics",
        certifications: ["CGRC"],
        workingGroups: ["Cloud Security"],
        termStartDate: "2018-11-20",
        termEndDate: "2023-11-19",
        history: [
            { period: 1, startDate: "2018-11-20", endDate: "2023-11-19", status: "Expired" }
        ]
    },
    {
        memberId: "000335896",
        name: "Touseef Gul",
        email: "touseef.g@isc2islamabad.org",
        chapter: "Pakistan Islamabad Chapter",
        role: "Member",
        company: "Islamabad Cyber Works",
        jobTitle: "Senior Incident Responder",
        specialisation: "Incident Response",
        industry: "Healthcare & Pharmaceuticals",
        certifications: ["CISSP"],
        workingGroups: ["DevSecOps"],
        termStartDate: "2026-03-09",
        termEndDate: "2027-03-09",
        history: [
            { period: 1, startDate: "2026-03-09", endDate: "2027-03-09", status: "Active" }
        ]
    },
    {
        memberId: "000335897",
        name: "Muhammad Huzaifa Rashid",
        email: "huzaifa.r@isc2islamabad.org",
        chapter: "Pakistan Islamabad Chapter",
        role: "Member",
        company: "GovSec Solutions",
        jobTitle: "Cryptographic Engineer",
        specialisation: "Cryptography & Communications Security",
        industry: "Government",
        certifications: ["CC"],
        workingGroups: ["DevSecOps"],
        termStartDate: "2021-11-04",
        termEndDate: "2023-11-04",
        history: [
            { period: 1, startDate: "2021-11-04", endDate: "2023-11-04", status: "Expired" }
        ]
    },
    {
        memberId: "000335898",
        name: "Waseem Sajjad",
        email: "waseem.s@isc2islamabad.org",
        chapter: "Pakistan Islamabad Chapter",
        role: "Member",
        company: "Pakistan Fintech Security",
        jobTitle: "Lead Auditor",
        specialisation: "Cyber Security Audit and Assurance",
        industry: "Finance & Financial Services",
        certifications: ["CISSP", "CGRC"],
        workingGroups: ["Cloud Security"],
        termStartDate: "2025-10-22",
        termEndDate: "2026-10-21",
        history: [
            { period: 1, startDate: "2025-10-22", endDate: "2026-10-21", status: "Active" }
        ]
    }
];

const SEED_REQUESTS = [
    {
        requestId: "REQ-2025-001",
        isc2Number: "000452101",
        name: "Ahmed Khan",
        email: "ahmed.k@example.com",
        company: "National Bank of Pakistan",
        jobTitle: "Senior Security Analyst",
        certifications: ["CISSP"],
        specialisation: "Cyber Security Governance & Risk Management",
        industry: "Finance & Financial Services",
        workingGroups: ["DevSecOps"],
        date: "2025-08-10",
        status: "Pending"
    },
    {
        requestId: "REQ-2025-002",
        isc2Number: "000452102",
        name: "Fatima Ali",
        email: "fatima.a@example.com",
        company: "PTCL",
        jobTitle: "Cloud Security Engineer",
        certifications: ["CCSP"],
        specialisation: "Cloud Security",
        industry: "Telecommunications, Technology, Internet & Electronics",
        workingGroups: ["Cloud Security"],
        date: "2025-08-09",
        status: "Pending"
    },
    {
        requestId: "REQ-2025-003",
        isc2Number: "000452103",
        name: "Usman Tariq",
        email: "usman.t@example.com",
        company: "Systems Limited",
        jobTitle: "Security Consultant",
        certifications: ["CC"],
        specialisation: "Cyber Security Generalists",
        industry: "Telecommunications, Technology, Internet & Electronics",
        workingGroups: ["Cloud Security"],
        date: "2025-08-08",
        status: "Pending"
    },
    {
        requestId: "REQ-2025-004",
        isc2Number: "000452104",
        name: "Sana Malik",
        email: "sana.m@example.com",
        company: "Jazz",
        jobTitle: "Network Security Specialist",
        certifications: ["SSCP"],
        specialisation: "Network Monitoring and Intrusion Detection",
        industry: "Telecommunications, Technology, Internet & Electronics",
        workingGroups: ["DevSecOps"],
        date: "2025-08-07",
        status: "Pending"
    },
    {
        requestId: "REQ-2025-005",
        isc2Number: "000452105",
        name: "Bilal Ahmed",
        email: "bilal.a@example.com",
        company: "Government of Pakistan",
        jobTitle: "Information Security Officer",
        certifications: ["CISSP", "CISM"],
        specialisation: "Cyber Security Strategy and Leadership",
        industry: "Government",
        workingGroups: ["Cloud Security", "DevSecOps"],
        date: "2025-08-06",
        status: "Pending"
    }
];

async function seedDatabase() {
    await initDb();

    console.log('--- Seeding Database ---');

    // 1. Seed Admin User
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@isc2islamabad.org';
    const adminPass = process.env.ADMIN_PASSWORD || 'Admin@ISC2!2026';
    const adminHash = bcrypt.hashSync(adminPass, 10);

    const existingAdmin = await queryOne('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (!existingAdmin) {
        await execute(`
            INSERT INTO users (email, isc2_number, password_hash, role)
            VALUES ($1, $2, $3, $4)
        `, [adminEmail, '000000001', adminHash, 'ADMIN']);
        console.log(`✓ Admin user created: ${adminEmail} (password: ${adminPass})`);
    } else {
        await execute('UPDATE users SET password_hash = $1 WHERE email = $2', [adminHash, adminEmail]);
        console.log(`✓ Admin password updated: ${adminEmail}`);
    }

    // 2. Seed Members and Multi-Term Histories
    for (const m of SEED_MEMBERS) {
        const certsJson = JSON.stringify(m.certifications || []);
        const groupsJson = JSON.stringify(m.workingGroups || []);

        // Check if member already exists
        const existing = await queryOne('SELECT id FROM members WHERE member_id = $1', [m.memberId]);
        if (!existing) {
            await execute(`
                INSERT INTO members (
                    member_id, name, email, chapter, role, company, job_title,
                    specialisation, industry, certifications, working_groups,
                    term_start_date, term_end_date
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            `, [
                m.memberId, m.name, m.email, m.chapter, m.role, m.company, m.jobTitle,
                m.specialisation, m.industry, certsJson, groupsJson,
                m.termStartDate, m.termEndDate
            ]);

            // Seed user login for each member (default password: Password@123)
            const memberPassHash = bcrypt.hashSync('Password@123', 10);
            await execute(`
                INSERT INTO users (email, isc2_number, password_hash, role)
                VALUES ($1, $2, $3, 'MEMBER')
                ON CONFLICT DO NOTHING
            `, [m.email, m.memberId, memberPassHash]);

            // Seed historical terms
            if (m.history && Array.isArray(m.history)) {
                for (const h of m.history) {
                    const existingHistory = await queryOne(
                        'SELECT id FROM membership_history WHERE member_id = $1 AND period_number = $2',
                        [m.memberId, h.period]
                    );
                    if (!existingHistory) {
                        await execute(`
                            INSERT INTO membership_history (member_id, period_number, start_date, end_date, status)
                            VALUES ($1, $2, $3, $4, $5)
                        `, [m.memberId, h.period, h.startDate, h.endDate, h.status]);
                    }
                }
            }
        }
    }
    console.log(`✓ Seeded ${SEED_MEMBERS.length} members with multi-term histories and credentials`);

    // 3. Seed Pending Applications
    for (const r of SEED_REQUESTS) {
        const existing = await queryOne('SELECT id FROM applications WHERE request_id = $1', [r.requestId]);
        if (!existing) {
            await execute(`
                INSERT INTO applications (
                    request_id, isc2_number, name, email, company, job_title,
                    specialisation, industry, certifications, working_groups, status, date
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `, [
                r.requestId, r.isc2Number, r.name, r.email, r.company, r.jobTitle,
                r.specialisation, r.industry,
                JSON.stringify(r.certifications || []),
                JSON.stringify(r.workingGroups || []),
                r.status, r.date
            ]);
        }
    }
    console.log(`✓ Seeded ${SEED_REQUESTS.length} pending membership applications`);
    console.log('✓ Seeding complete!');
}

if (require.main === module) {
    seedDatabase().then(() => process.exit(0)).catch(err => {
        console.error('Seeding failed:', err);
        process.exit(1);
    });
}

module.exports = { seedDatabase };
