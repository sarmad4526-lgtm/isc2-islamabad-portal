require('dotenv').config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const app = require('./server/app');
const { initDb } = require('./server/config/db');
const { seedDatabase } = require('./server/seed/seeder');

const PORT = process.env.PORT || 5000;

// Initialize Database & Seeds, then start server
async function start() {
    await initDb();
    await seedDatabase();

    const server = app.listen(PORT, () => {
        console.log(`====================================================`);
        console.log(`🚀 ISC2 Islamabad Chapter Portal Server Running!`);
        console.log(`📡 Local URL: http://localhost:${PORT}`);
        console.log(`🛡️  Admin Dashboard: http://localhost:${PORT}/admin.html`);
        console.log(`👥 Member Login: http://localhost:${PORT}/login.html`);
        console.log(`📝 Membership Form: http://localhost:${PORT}/membership.html`);
        console.log(`====================================================`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('SIGTERM received. Shutting down gracefully...');
        server.close(() => {
            console.log('Server process terminated.');
        });
    });
}

if (require.main === module) {
    start().catch(err => {
        console.error('Failed to start server:', err);
        process.exit(1);
    });
}
