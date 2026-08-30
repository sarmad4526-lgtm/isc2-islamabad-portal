const path = require('path');
const Database = require('better-sqlite3');

const isVercel = Boolean(process.env.VERCEL);
const dbPath = isVercel ? path.join('/tmp', 'portal.db') : path.resolve(__dirname, '../../portal.db');

const db = new Database(dbPath, {
    // verbose: console.log
});

// Enable Foreign Key support and WAL mode for local high performance concurrency
db.pragma('foreign_keys = ON');
if (!isVercel) {
    db.pragma('journal_mode = WAL');
}

function initDb() {
    // 1. Users table (Admins and Members)
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            isc2_number TEXT UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'MEMBER' CHECK(role IN ('ADMIN', 'MEMBER')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // 2. Members table
    db.exec(`
        CREATE TABLE IF NOT EXISTS members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            member_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            chapter TEXT DEFAULT 'Pakistan Islamabad Chapter',
            role TEXT DEFAULT 'Member',
            company TEXT,
            job_title TEXT,
            specialisation TEXT,
            industry TEXT,
            certifications TEXT DEFAULT '[]',
            working_groups TEXT DEFAULT '[]',
            term_start_date TEXT NOT NULL,
            term_end_date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // 3. Multi-Term Membership History table
    db.exec(`
        CREATE TABLE IF NOT EXISTS membership_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            member_id TEXT NOT NULL,
            period_number INTEGER NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('Active', 'Expired')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE
        );
    `);

    // 4. Membership Applications table
    db.exec(`
        CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_id TEXT UNIQUE NOT NULL,
            isc2_number TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            company TEXT,
            job_title TEXT,
            specialisation TEXT,
            industry TEXT,
            certifications TEXT DEFAULT '[]',
            working_groups TEXT DEFAULT '[]',
            status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Rejected')),
            date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // 5. Email Logs table
    db.exec(`
        CREATE TABLE IF NOT EXISTS email_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            recipient_count INTEGER NOT NULL,
            sent_by TEXT,
            sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Create helpful indices
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_members_term_end ON members(term_end_date);
        CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
        CREATE INDEX IF NOT EXISTS idx_history_member_id ON membership_history(member_id);
    `);

    console.log('✓ SQLite Database schema initialized successfully');
}

// Helper date math functions
function getTodayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function calculateEndDate(startDateStr) {
    const parts = startDateStr.split('-');
    let year = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10) - 1;
    let day = parseInt(parts[2], 10);

    const start = new Date(year, month, day);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);

    if (month === 1 && day === 29 && end.getMonth() === 2) {
        end.setDate(0); // Leap year adjustment
    }

    const resYear = end.getFullYear();
    const resMonth = String(end.getMonth() + 1).padStart(2, '0');
    const resDay = String(end.getDate()).padStart(2, '0');
    return `${resYear}-${resMonth}-${resDay}`;
}

function getMemberStatus(termEndDate) {
    if (!termEndDate) return 'Inactive';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parts = termEndDate.split('-');
    const endDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    endDate.setHours(0, 0, 0, 0);

    return today >= endDate ? 'Inactive' : 'Active';
}

module.exports = {
    db,
    initDb,
    getTodayString,
    calculateEndDate,
    getMemberStatus
};
