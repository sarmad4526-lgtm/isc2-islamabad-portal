const app = require('../server/app');
const { initDb, queryOne, execute, isTurso, isPostgres, isVercel } = require('../server/config/db');

// Vercel serverless: initialize DB and ensure admin user on cold start
let dbReady = null;

async function ensureAdminUser() {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@isc2islamabad.org';
        const adminPass = process.env.ADMIN_PASSWORD || 'Admin@ISC2!2026';
        
        const existing = await queryOne('SELECT id FROM users WHERE email = $1', [adminEmail]);
        if (!existing) {
            const bcrypt = require('bcryptjs');
            const adminHash = bcrypt.hashSync(adminPass, 10);
            await execute(`
                INSERT INTO users (email, isc2_number, password_hash, role)
                VALUES ($1, $2, $3, $4)
            `, [adminEmail, '000000001', adminHash, 'ADMIN']);
            console.log(`✓ Admin user created: ${adminEmail}`);
        }
    } catch (err) {
        console.error('ensureAdminUser error:', err.message || err);
    }
}

function ensureDb() {
    if (!dbReady) {
        dbReady = (async () => {
            // On Vercel, only initialize DB if cloud DB (Turso/Postgres) is configured
            if (!isVercel || isTurso || isPostgres) {
                try {
                    await initDb();
                    await ensureAdminUser();
                    console.log('✓ DB schema & admin user ready');
                } catch (error) {
                    console.error('Database initialization error:', error.message || error);
                    dbReady = null;
                }
            } else {
                console.warn('⚠️ Running on Vercel without TURSO_DATABASE_URL configured. Static routes will serve cleanly; database endpoints require Turso environment variables.');
            }
        })();
    }
    return dbReady;
}

// Wrap Express app in async handler
const handler = async (req, res) => {
    try {
        await ensureDb();
    } catch (e) {
        console.error('Handler ensureDb catch:', e.message || e);
    }
    console.log('Incoming Vercel req.url:', req.url);
    console.log('Vercel x-matched-path:', req.headers['x-matched-path']);
    console.log('Vercel x-forwarded-path:', req.headers['x-forwarded-path']);
    console.log('Vercel x-invoke-path:', req.headers['x-invoke-path']);
    console.log('Vercel x-now-route-matches:', req.headers['x-now-route-matches']);

    const targetUrl = req.headers['x-forwarded-path'] || req.headers['x-invoke-path'] || req.headers['x-matched-path'];
    if (targetUrl && targetUrl !== '/api/index') {
        req.url = targetUrl;
    }
    return app(req, res);
};

module.exports = handler;
