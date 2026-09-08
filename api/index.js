const app = require('../server/app');
const { initDb } = require('../server/config/db');
const { seedDatabase } = require('../server/seed/seeder');

// Vercel serverless: initialize DB on first invocation
let dbReady = null;

function ensureDb() {
    if (!dbReady) {
        dbReady = (async () => {
            try {
                await initDb();
                await seedDatabase();
                console.log('✓ Vercel: Database initialized and seeded');
            } catch (error) {
                console.error('Database initialization on serverless startup error:', error);
                // Reset so it retries on next invocation
                dbReady = null;
                throw error;
            }
        })();
    }
    return dbReady;
}

// Wrap the Express app in a handler that ensures DB is ready
const handler = async (req, res) => {
    await ensureDb();
    return app(req, res);
};

module.exports = handler;
