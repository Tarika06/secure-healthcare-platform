/**
 * Migration script to add createdAt/updatedAt timestamps to existing users
 * Run this once to backfill timestamps for users created before the schema update
 * 
 * Usage: node src/scripts/migrateUserTimestamps.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/securecare';

async function migrateUserTimestamps() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Find all users without createdAt
        const usersWithoutTimestamp = await User.find({ createdAt: { $exists: false } });
        console.log(`Found ${usersWithoutTimestamp.length} users without createdAt timestamp`);

        if (usersWithoutTimestamp.length === 0) {
            console.log('All users already have timestamps. Nothing to migrate.');
            process.exit(0);
        }

        // Set createdAt to current date for existing users (they were created before this feature)
        const now = new Date();

        for (const user of usersWithoutTimestamp) {
            await User.updateOne(
                { _id: user._id },
                {
                    $set: {
                        createdAt: now,
                        updatedAt: now
                    }
                }
            );
            console.log(`Updated user: ${user.userId}`);
        }

        console.log(`\n✅ Migration complete! Updated ${usersWithoutTimestamp.length} users.`);
        console.log('Note: Existing users now show today as their "Member Since" date.');
        console.log('New registrations will correctly track their actual join date.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    }
}

migrateUserTimestamps();
