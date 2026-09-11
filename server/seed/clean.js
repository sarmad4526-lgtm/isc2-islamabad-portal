const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });
require('dotenv').config();
const { initDb, execute, queryOne, queryAll } = require('../config/db');
const { seedDatabase } = require('./seeder');

async function cleanDatabase() {
    await initDb();

    console.log('🧹 --- Cleaning Dummy Database Entries ---');

    // 1. Delete all membership history
    await execute('DELETE FROM membership_history');
    console.log('✓ Cleared membership_history table');

    // 2. Delete all members
    await execute('DELETE FROM members');
    console.log('✓ Cleared members table');

    // 3. Delete all pending/processed applications
    await execute('DELETE FROM applications');
    console.log('✓ Cleared applications table');

    // 4. Delete all email logs
    await execute('DELETE FROM email_logs');
    console.log('✓ Cleared email_logs table');

    // 5. Delete non-admin user accounts
    await execute("DELETE FROM users WHERE role != 'ADMIN'");
    console.log('✓ Cleared non-admin user accounts');

    // 6. Re-run seeder to ensure Admin account exists and is valid
    await seedDatabase();

    const adminUser = await queryOne("SELECT email, role FROM users WHERE role = 'ADMIN'");
    const memberCount = await queryOne("SELECT COUNT(*) as count FROM members");
    const appCount = await queryOne("SELECT COUNT(*) as count FROM applications");

    console.log('\n====================================================');
    console.log('🎉 Database successfully cleaned for production handover!');
    console.log(`🛡️  Admin Account Present: ${adminUser ? adminUser.email : 'None'}`);
    console.log(`👥 Total Members: ${memberCount ? memberCount.count : 0}`);
    console.log(`📝 Total Applications: ${appCount ? appCount.count : 0}`);
    console.log('====================================================');
}

if (require.main === module) {
    cleanDatabase().then(() => process.exit(0)).catch(err => {
        console.error('Database clean failed:', err);
        process.exit(1);
    });
}

module.exports = { cleanDatabase };
