require('dotenv').config();
const app = require('./server/app');
const { initDb } = require('./server/config/db');
const { seedDatabase } = require('./server/seed/seeder');

const PORT = process.env.PORT || 5000;

// Initialize Database & Seeds if needed
initDb();
seedDatabase();

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
