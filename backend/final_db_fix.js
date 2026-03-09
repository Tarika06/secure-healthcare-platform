const { MongoClient } = require('mongodb');

async function run() {
    const uri = 'mongodb+srv://db_user:db_user_password@cluster0.qcy69uq.mongodb.net/securecare_db';
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });

    try {
        console.log("Connecting to MongoDB...");
        await client.connect();
        const db = client.db('securecare_db');
        const collection = db.collection('users');

        console.log("Restoring Admin roles...");
        // Restore Admin role for A001 specifically or any ID starting with A
        const result = await collection.updateMany(
            { userId: /^A/i },
            { $set: { role: 'ADMIN', status: 'ACTIVE' } }
        );

        console.log(`Successfully restored ${result.modifiedCount} admin accounts.`);

        // Also clear any residue from the failed experiment
        await collection.updateMany({}, { $unset: { lastActive: "" } });
        console.log("Cleaned up database fields.");

        process.exit(0);
    } catch (err) {
        console.error("CRITICAL ERROR:", err.message);
        process.exit(1);
    } finally {
        await client.close();
    }
}

run();
