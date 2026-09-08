const app = require('../server/app');
const { initDb, queryOne, execute } = require('../server/config/db');

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
            try {
                await initDb();
                await ensureAdminUser();
                console.log('✓ Vercel: DB schema & admin user ready');
            } catch (error) {
                console.error('Database initialization on Vercel error:', error.message || error);
                dbReady = null;
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
    return app(req, res);
};

module.exports = handler;
