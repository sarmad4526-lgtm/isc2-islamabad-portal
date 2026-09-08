/**
 * Dual-mode Database Layer
 * 
 * Uses PostgreSQL when POSTGRES_URL is set (Vercel production),
 * otherwise falls back to local SQLite via better-sqlite3.
 * 
 * All exported functions are ASYNC for unified API across both backends.
 */
require('dotenv').config();
const path = require('path');

// ─── Detect environment ─────────────────────────────────────────────────
const isPostgres = Boolean(process.env.POSTGRES_URL);

// ─── Postgres setup ─────────────────────────────────────────────────────
let pgPool = null;

function getPgPool() {
    if (pgPool) return pgPool;
    const { Pool } = require('pg');
    pgPool = new Pool({
        connectionString: process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000
    });
    return pgPool;
}

// ─── SQLite setup ───────────────────────────────────────────────────────
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

// ─── Unified query interface ────────────────────────────────────────────

/**
 * Execute a query and return all matching rows.
 * @param {string} sql - SQL query (use $1, $2... for Postgres, ? for SQLite)
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Array of row objects
 */
async function queryAll(sql, params = []) {
    if (isPostgres) {
        const pool = getPgPool();
        const result = await pool.query(sql, params);
        return result.rows;
    } else {
        const db = getSqliteDb();
        const pgSql = convertPgToSqlite(sql);
        return db.prepare(pgSql).all(...params);
    }
}

/**
 * Execute a query and return the first matching row.
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object|undefined>} Single row or undefined
 */
async function queryOne(sql, params = []) {
    if (isPostgres) {
        const pool = getPgPool();
        const result = await pool.query(sql, params);
        return result.rows[0] || undefined;
    } else {
        const db = getSqliteDb();
        const pgSql = convertPgToSqlite(sql);
        return db.prepare(pgSql).get(...params);
    }
}

/**
 * Execute an INSERT/UPDATE/DELETE and return result info.
 * @param {string} sql - SQL statement
 * @param {Array} params - Query parameters
 * @returns {Promise<{rowCount: number, lastId: number|null}>}
 */
async function execute(sql, params = []) {
    if (isPostgres) {
        const pool = getPgPool();
        const result = await pool.query(sql, params);
        // For INSERT with RETURNING, provide the returned rows
        return {
            rowCount: result.rowCount,
            lastId: result.rows && result.rows[0] ? result.rows[0].id : null,
            rows: result.rows || []
        };
    } else {
        const db = getSqliteDb();
        const pgSql = convertPgToSqlite(sql);
        const info = db.prepare(pgSql).run(...params);
        return {
            rowCount: info.changes,
            lastId: info.lastInsertRowid || null,
            rows: []
        };
    }
}

/**
 * Execute multiple statements within a transaction.
 * @param {Function} fn - async function(client) that receives a query client
 */
async function transaction(fn) {
    if (isPostgres) {
        const pool = getPgPool();
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const txHelper = {
                queryAll: async (sql, params = []) => {
                    const result = await client.query(sql, params);
                    return result.rows;
                },
                queryOne: async (sql, params = []) => {
                    const result = await client.query(sql, params);
                    return result.rows[0] || undefined;
                },
                execute: async (sql, params = []) => {
                    const result = await client.query(sql, params);
                    return {
                        rowCount: result.rowCount,
                        lastId: result.rows && result.rows[0] ? result.rows[0].id : null,
                        rows: result.rows || []
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
        const sqliteTx = db.transaction(() => {});
        // For SQLite, we run synchronously inside a transaction wrapper
        const txHelper = {
            queryAll: async (sql, params = []) => {
                const pgSql = convertPgToSqlite(sql);
                return db.prepare(pgSql).all(...params);
            },
            queryOne: async (sql, params = []) => {
                const pgSql = convertPgToSqlite(sql);
                return db.prepare(pgSql).get(...params) || undefined;
            },
            execute: async (sql, params = []) => {
                const pgSql = convertPgToSqlite(sql);
                const info = db.prepare(pgSql).run(...params);
                return {
                    rowCount: info.changes,
                    lastId: info.lastInsertRowid || null,
                    rows: []
                };
            }
        };
        // Wrap in SQLite transaction
        const wrappedFn = db.transaction(async () => {
            await fn(txHelper);
        });
        // SQLite transactions are synchronous, but our fn is async.
        // We need to run the async body synchronously for SQLite.
        // Re-implement with sync calls:
        const syncTxHelper = {
            queryAll: async (sql, params = []) => {
                const pgSql = convertPgToSqlite(sql);
                return db.prepare(pgSql).all(...params);
            },
            queryOne: async (sql, params = []) => {
                const pgSql = convertPgToSqlite(sql);
                return db.prepare(pgSql).get(...params) || undefined;
            },
            execute: async (sql, params = []) => {
                const pgSql = convertPgToSqlite(sql);
                const info = db.prepare(pgSql).run(...params);
                return {
                    rowCount: info.changes,
                    lastId: info.lastInsertRowid || null,
                    rows: []
                };
            }
        };
        // For SQLite: begin/commit manually
        db.exec('BEGIN');
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
    if (isPostgres) {
        await initPostgresSchema();
    } else {
        initSqliteSchema();
    }
    console.log('✓ Database schema initialized successfully');
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

    // Create indices (IF NOT EXISTS for idempotency)
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
        )
    `);

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
            country TEXT,
            city TEXT,
            certifications TEXT DEFAULT '[]',
            working_groups TEXT DEFAULT '[]',
            term_start_date TEXT NOT NULL,
            term_end_date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

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
        )
    `);

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
            country TEXT,
            city TEXT,
            certifications TEXT DEFAULT '[]',
            working_groups TEXT DEFAULT '[]',
            status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Rejected')),
            date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS email_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            recipient_count INTEGER NOT NULL,
            sent_by TEXT,
            sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.exec(`
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

// ─── SQL dialect conversion ─────────────────────────────────────────────

/**
 * Converts Postgres-style $1, $2 placeholders to SQLite ? placeholders.
 * Also handles minor syntax differences.
 */
function convertPgToSqlite(sql) {
    // Replace $1, $2, etc. with ?
    let converted = sql.replace(/\$\d+/g, '?');
    // Convert Postgres ON CONFLICT DO NOTHING to SQLite INSERT OR IGNORE
    if (/ON\s+CONFLICT\s+DO\s+NOTHING/i.test(converted)) {
        converted = converted.replace(/\s+ON\s+CONFLICT\s+DO\s+NOTHING/i, '');
        converted = converted.replace(/INSERT\s+INTO/i, 'INSERT OR IGNORE INTO');
    }
    // Handle RETURNING clause - strip it for SQLite
    converted = converted.replace(/\s+RETURNING\s+.*/i, '');
    return converted;
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
    isPostgres
};
