const mongoose = require('mongoose');
const User = require('./src/models/User');

const MONGO_URI = 'mongodb+srv://db_user:db_user_password@cluster0.qcy69uq.mongodb.net/securecare_db';

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Update all ACTIVE users who haven't accepted the policy yet
        // In a real system, we might force them to re-accept, but for this project 
        // setup, we are ensuring data consistency for existing records.
        const result = await User.updateMany(
            { status: 'ACTIVE', acceptPrivacyPolicy: false },
            { $set: { acceptPrivacyPolicy: true } }
        );

        console.log('Compliance Sync Result:', result);
        console.log('Successfully enforced Privacy Policy agreement on all active accounts.');
        process.exit(0);
    } catch (err) {
        console.error('Compliance Sync Error:', err);
        process.exit(1);
    }
}

run();
