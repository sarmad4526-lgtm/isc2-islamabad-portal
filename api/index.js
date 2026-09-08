const app = require('../server/app');
const { initDb, isTurso, isPostgres } = require('../server/config/db');

// Vercel serverless: initialize DB on first invocation
let dbReady = null;

function ensureDb() {
    if (!dbReady) {
        dbReady = (async () => {
            try {
                await initDb();
                if (isTurso || isPostgres) {
                    const { seedDatabase } = require('../server/seed/seeder');
                    await seedDatabase();
                    console.log('✓ Vercel: Database initialized and seeded successfully');
                }
            } catch (error) {
                console.error('Database initialization on Vercel error:', error.message || error);
                // Reset so it retries on next invocation
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
