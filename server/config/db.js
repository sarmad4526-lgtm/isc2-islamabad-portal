/**
 * Dual-mode Database Layer for Turso & Local SQLite
 * 
 * Uses Turso (@libsql/client) when TURSO_DATABASE_URL or TURSO_URL is set (Vercel production),
 * otherwise falls back to local SQLite via better-sqlite3.
 * 
 * All exported functions are ASYNC for a unified API across both backends.
 */
require('dotenv').config();
const path = require('path');

// ─── Detect environment ─────────────────────────────────────────────────
const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.TURSO_URL || (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('libsql') ? process.env.DATABASE_URL : null);
const isTurso = Boolean(tursoUrl);

// ─── Turso setup ────────────────────────────────────────────────────────
let tursoClient = null;

function getTursoClient() {
    if (tursoClient) return tursoClient;
    const { createClient } = require('@libsql/client');
    tursoClient = createClient({
        url: tursoUrl,
        authToken: process.env.TURSO_AUTH_TOKEN
    });
    return tursoClient;
}

// ─── Local SQLite setup ─────────────────────────────────────────────────
let sqliteDb = null;

function getSqliteDb() {
    if (sqliteDb) return sqliteDb;
    const Database = require('better-sqlite3');
    const dbPath = path.resolve(__dirname, '../../portal.db');
    sqliteDb = new Database(dbPath);
    sqliteDb.pragma('foreign_keys = ON');
    sqliteDb.pragma('journal_mode = WAL');
    return sqliteDb;
}

// ─── Parameter Normalizer ───────────────────────────────────────────────
/**
 * Normalizes PostgreSQL $1, $2 positional placeholders to SQLite ? placeholders.
 */
function normalizeSql(sql) {
    if (!sql) return sql;
    return sql.replace(/\$\d+/g, '?');
}

// ─── Unified query interface ────────────────────────────────────────────

/**
 * Execute a query and return all matching rows.
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Array of row objects
 */
async function queryAll(sql, params = []) {
    const cleanSql = normalizeSql(sql);
    if (isTurso) {
        const client = getTursoClient();
        const res = await client.execute({ sql: cleanSql, args: params });
        return res.rows;
    } else {
        const db = getSqliteDb();
        return db.prepare(cleanSql).all(...params);
    }
}

/**
 * Execute a query and return the first matching row.
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object|undefined>} Single row or undefined
 */
async function queryOne(sql, params = []) {
    const cleanSql = normalizeSql(sql);
    if (isTurso) {
        const client = getTursoClient();
        const res = await client.execute({ sql: cleanSql, args: params });
        return res.rows[0] || undefined;
    } else {
        const db = getSqliteDb();
        return db.prepare(cleanSql).get(...params) || undefined;
    }
}

/**
 * Execute an INSERT/UPDATE/DELETE and return result info.
 * @param {string} sql - SQL statement
 * @param {Array} params - Query parameters
 * @returns {Promise<{rowCount: number, lastId: number|null, rows: Array}>}
 */
async function execute(sql, params = []) {
    const cleanSql = normalizeSql(sql);
    if (isTurso) {
        const client = getTursoClient();
        const res = await client.execute({ sql: cleanSql, args: params });
        return {
            rowCount: res.rowsAffected,
            lastId: res.lastInsertRowid !== undefined && res.lastInsertRowid !== null ? Number(res.lastInsertRowid) : null,
            rows: res.rows || []
        };
    } else {
        const db = getSqliteDb();
        const info = db.prepare(cleanSql).run(...params);
        return {
            rowCount: info.changes,
            lastId: info.lastInsertRowid || null,
            rows: []
        };
    }
}

/**
 * Execute multiple statements within a transaction.
 * @param {Function} fn - async function(txHelper) that receives a query client
 */
async function transaction(fn) {
    if (isTurso) {
        const client = getTursoClient();
        const tx = await client.transaction('write');
        const txHelper = {
            queryAll: async (sql, params = []) => {
                const res = await tx.execute({ sql: normalizeSql(sql), args: params });
                return res.rows;
            },
            queryOne: async (sql, params = []) => {
                const res = await tx.execute({ sql: normalizeSql(sql), args: params });
                return res.rows[0] || undefined;
            },
            execute: async (sql, params = []) => {
                const res = await tx.execute({ sql: normalizeSql(sql), args: params });
                return {
                    rowCount: res.rowsAffected,
                    lastId: res.lastInsertRowid !== undefined && res.lastInsertRowid !== null ? Number(res.lastInsertRowid) : null,
                    rows: res.rows || []
                };
            }
        };
        try {
            await fn(txHelper);
            await tx.commit();
        } catch (err) {
            await tx.rollback();
            throw err;
        } finally {
            tx.close();
        }
    } else {
        const db = getSqliteDb();
        db.exec('BEGIN');
        const syncTxHelper = {
            queryAll: async (sql, params = []) => db.prepare(normalizeSql(sql)).all(...params),
            queryOne: async (sql, params = []) => db.prepare(normalizeSql(sql)).get(...params) || undefined,
            execute: async (sql, params = []) => {
                const info = db.prepare(normalizeSql(sql)).run(...params);
                return {
                    rowCount: info.changes,
                    lastId: info.lastInsertRowid || null,
                    rows: []
                };
            }
        };
        try {
            await fn(syncTxHelper);
            db.exec('COMMIT');
        } catch (err) {
            db.exec('ROLLBACK');
            throw err;
        }
    }
}

// ─── Schema initialization ──────────────────────────────────────────────

async function initDb() {
    if (isTurso) {
        await initTursoSchema();
    } else {
        initSqliteSchema();
    }
    console.log(`✓ Database schema initialized successfully (${isTurso ? 'Turso' : 'Local SQLite'})`);
}

async function initTursoSchema() {
    const client = getTursoClient();

    const statements = [
        `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            isc2_number TEXT UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'MEMBER' CHECK(role IN ('ADMIN', 'MEMBER')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS members (
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
            country TEXT,
            city TEXT,
            certifications TEXT DEFAULT '[]',
            working_groups TEXT DEFAULT '[]',
            term_start_date TEXT NOT NULL,
            term_end_date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS membership_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            member_id TEXT NOT NULL,
            period_number INTEGER NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('Active', 'Expired')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_id TEXT UNIQUE NOT NULL,
            isc2_number TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            company TEXT,
            job_title TEXT,
            specialisation TEXT,
            industry TEXT,
            country TEXT,
            city TEXT,
            certifications TEXT DEFAULT '[]',
            working_groups TEXT DEFAULT '[]',
            status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Rejected')),
            date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS email_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            recipient_count INTEGER NOT NULL,
            sent_by TEXT,
            sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE INDEX IF NOT EXISTS idx_members_term_end ON members(term_end_date)`,
        `CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)`,
        `CREATE INDEX IF NOT EXISTS idx_history_member_id ON membership_history(member_id)`
    ];

    for (const sql of statements) {
        await client.execute(sql);
    }
}

function initSqliteSchema() {
    const db = getSqliteDb();

    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            isc2_number TEXT UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'MEMBER' CHECK(role IN ('ADMIN', 'MEMBER')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

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
            country TEXT,
            city TEXT,
            certifications TEXT DEFAULT '[]',
            working_groups TEXT DEFAULT '[]',
            term_start_date TEXT NOT NULL,
            term_end_date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

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
            country TEXT,
            city TEXT,
            certifications TEXT DEFAULT '[]',
            working_groups TEXT DEFAULT '[]',
            status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Rejected')),
            date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS email_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            recipient_count INTEGER NOT NULL,
            sent_by TEXT,
            sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_members_term_end ON members(term_end_date);
        CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
        CREATE INDEX IF NOT EXISTS idx_history_member_id ON membership_history(member_id);
    `);

    // Automatic migration: Add country and city columns if they don't exist
    try {
        const membersInfo = db.prepare("PRAGMA table_info(members)").all();
        if (!membersInfo.some(col => col.name === 'country')) {
            db.exec("ALTER TABLE members ADD COLUMN country TEXT");
            db.exec("ALTER TABLE members ADD COLUMN city TEXT");
            console.log('✓ Migrated members table: added country & city columns');
        }

        const appsInfo = db.prepare("PRAGMA table_info(applications)").all();
        if (!appsInfo.some(col => col.name === 'country')) {
            db.exec("ALTER TABLE applications ADD COLUMN country TEXT");
            db.exec("ALTER TABLE applications ADD COLUMN city TEXT");
            console.log('✓ Migrated applications table: added country & city columns');
        }
    } catch (e) {
        console.error('Migration error:', e);
    }
}

// ─── Helper functions ───────────────────────────────────────────────────

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

// ─── Exports ────────────────────────────────────────────────────────────

module.exports = {
    queryAll,
    queryOne,
    execute,
    transaction,
    initDb,
    getTodayString,
    calculateEndDate,
    getMemberStatus,
    isTurso
};
