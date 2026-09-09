/**
 * Multi-mode Database Layer for Turso, PostgreSQL & Local SQLite
 * 
 * Mode 1: Turso (@libsql/client) when TURSO_DATABASE_URL or TURSO_URL is set
 * Mode 2: PostgreSQL (pg) when POSTGRES_URL or DATABASE_URL is set
 * Mode 3: Local SQLite (better-sqlite3) fallback for local development
 * 
 * All exported functions are ASYNC for a unified API across all backends.
 */
require('dotenv').config();
const path = require('path');

// ─── Detect environment ─────────────────────────────────────────────────
const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
const rawTursoUrl = process.env.TURSO_DATABASE_URL || process.env.TURSO_URL;
const tursoUrl = rawTursoUrl ? rawTursoUrl.trim().replace(/^["']|["']$/g, '') : null;
const isTurso = Boolean(tursoUrl);
const pgUrl = !isTurso ? (process.env.POSTGRES_URL || process.env.DATABASE_URL) : null;
const isPostgres = Boolean(pgUrl);

// ─── Turso setup ────────────────────────────────────────────────────────
let tursoClient = null;

function getTursoClient() {
    if (tursoClient) return tursoClient;
    const { createClient } = require('@libsql/client');
    const rawAuthToken = process.env.TURSO_AUTH_TOKEN;
    const authToken = rawAuthToken ? rawAuthToken.trim().replace(/^["']|["']$/g, '') : undefined;
    tursoClient = createClient({
        url: tursoUrl,
        authToken: authToken
    });
    return tursoClient;
}

// ─── Postgres setup ─────────────────────────────────────────────────────
let pgPool = null;

function getPgPool() {
    if (pgPool) return pgPool;
    const { Pool } = require('pg');
    pgPool = new Pool({
        connectionString: pgUrl,
        ssl: pgUrl && pgUrl.includes('localhost') ? false : { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000
    });
    return pgPool;
}

// ─── Local SQLite setup ─────────────────────────────────────────────────
let sqliteDb = null;

function getSqliteDb() {
    if (sqliteDb) return sqliteDb;
    if (isVercel) {
        throw new Error('Local SQLite (better-sqlite3) cannot be used in read-only Vercel Serverless environment. Please ensure TURSO_DATABASE_URL or POSTGRES_URL is configured in Vercel Environment Variables.');
    }
    try {
        const Database = require('better-sqlite3');
        const dbPath = path.resolve(__dirname, '../../portal.db');
        sqliteDb = new Database(dbPath);
        sqliteDb.pragma('foreign_keys = ON');
        sqliteDb.pragma('journal_mode = WAL');
        return sqliteDb;
    } catch (err) {
        console.error('better-sqlite3 not available:', err.message);
        throw err;
    }
}

// ─── Parameter & Syntax Normalizer ──────────────────────────────────────
function normalizeSql(sql) {
    if (!sql) return sql;
    let clean = sql;

    if (isPostgres) {
        if (/INSERT\s+OR\s+IGNORE\s+INTO/i.test(clean)) {
            clean = clean.replace(/INSERT\s+OR\s+IGNORE\s+INTO/i, 'INSERT INTO');
            if (!/ON\s+CONFLICT/i.test(clean)) {
                clean += ' ON CONFLICT DO NOTHING';
            }
        }
        return clean;
    } else {
        clean = clean.replace(/\$\d+/g, '?');
        if (/ON\s+CONFLICT\s+DO\s+NOTHING/i.test(clean)) {
            clean = clean.replace(/\s+ON\s+CONFLICT\s+DO\s+NOTHING/i, '');
            if (!/INSERT\s+OR\s+IGNORE/i.test(clean)) {
                clean = clean.replace(/INSERT\s+INTO/i, 'INSERT OR IGNORE INTO');
            }
        }
        clean = clean.replace(/\s+RETURNING\s+.*/i, '');
        return clean;
    }
}

// ─── Unified query interface ────────────────────────────────────────────

async function queryAll(sql, params = []) {
    const cleanSql = normalizeSql(sql);
    if (isTurso) {
        const client = getTursoClient();
        const res = await client.execute({ sql: cleanSql, args: params });
        return res.rows;
    } else if (isPostgres) {
        const pool = getPgPool();
        const res = await pool.query(cleanSql, params);
        return res.rows;
    } else {
        const db = getSqliteDb();
        return db.prepare(cleanSql).all(...params);
    }
}

async function queryOne(sql, params = []) {
    const cleanSql = normalizeSql(sql);
    if (isTurso) {
        const client = getTursoClient();
        const res = await client.execute({ sql: cleanSql, args: params });
        return res.rows[0] || undefined;
    } else if (isPostgres) {
        const pool = getPgPool();
        const res = await pool.query(cleanSql, params);
        return res.rows[0] || undefined;
    } else {
        const db = getSqliteDb();
        return db.prepare(cleanSql).get(...params) || undefined;
    }
}

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
    } else if (isPostgres) {
        const pool = getPgPool();
        const res = await pool.query(cleanSql, params);
        return {
            rowCount: res.rowCount,
            lastId: res.rows && res.rows[0] ? res.rows[0].id : null,
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
    } else if (isPostgres) {
        const pool = getPgPool();
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const txHelper = {
                queryAll: async (sql, params = []) => {
                    const res = await client.query(normalizeSql(sql), params);
                    return res.rows;
                },
                queryOne: async (sql, params = []) => {
                    const res = await client.query(normalizeSql(sql), params);
                    return res.rows[0] || undefined;
                },
                execute: async (sql, params = []) => {
                    const res = await client.query(normalizeSql(sql), params);
                    return {
                        rowCount: res.rowCount,
                        lastId: res.rows && res.rows[0] ? res.rows[0].id : null,
                        rows: res.rows || []
                    };
                }
            };
            await fn(txHelper);
            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
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
    } else if (isPostgres) {
        await initPostgresSchema();
    } else if (!isVercel) {
        initSqliteSchema();
    } else {
        console.warn('⚠️ Running on Vercel without cloud database variables configured!');
        return;
    }
    const modeName = isTurso ? 'Turso' : isPostgres ? 'PostgreSQL' : 'Local SQLite';
    console.log(`✓ Database schema initialized successfully (${modeName})`);
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

async function initPostgresSchema() {
    const pool = getPgPool();

    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            isc2_number TEXT UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'MEMBER' CHECK(role IN ('ADMIN', 'MEMBER')),
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS members (
            id SERIAL PRIMARY KEY,
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
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS membership_history (
            id SERIAL PRIMARY KEY,
            member_id TEXT NOT NULL,
            period_number INTEGER NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('Active', 'Expired')),
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS applications (
            id SERIAL PRIMARY KEY,
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
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS email_logs (
            id SERIAL PRIMARY KEY,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            recipient_count INTEGER NOT NULL,
            sent_by TEXT,
            sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_members_term_end ON members(term_end_date)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_history_member_id ON membership_history(member_id)`);
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
    isTurso,
    isPostgres,
    isVercel
};
