const app = require('../server/app');
const { initDb } = require('../server/config/db');
const { seedDatabase } = require('../server/seed/seeder');

try {
    initDb();
    seedDatabase();
} catch (error) {
    console.error('Database initialization on serverless startup error:', error);
}

module.exports = app;
