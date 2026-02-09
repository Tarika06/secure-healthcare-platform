require('dotenv').config();
const mongoose = require('mongoose');

async function fixTimestamps() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Direct collection update to bypass Mongoose schema
    const result = await mongoose.connection.db.collection('users').updateMany(
        { createdAt: { $exists: false } },
        { $set: { createdAt: new Date(), updatedAt: new Date() } }
    );

    console.log('Updated', result.modifiedCount, 'users without createdAt');

    // Also set for users where createdAt is null
    const result2 = await mongoose.connection.db.collection('users').updateMany(
        { createdAt: null },
        { $set: { createdAt: new Date(), updatedAt: new Date() } }
    );

    console.log('Updated', result2.modifiedCount, 'users with null createdAt');

    // Check all users now
    const users = await mongoose.connection.db.collection('users').find({}).project({ userId: 1, createdAt: 1 }).toArray();
    console.log('\nAll users createdAt status:');
    users.forEach(u => console.log(`  ${u.userId}: ${u.createdAt ? u.createdAt.toISOString() : 'MISSING'}`));

    await mongoose.disconnect();
    process.exit(0);
}

fixTimestamps().catch(err => {
    console.error(err);
    process.exit(1);
});
