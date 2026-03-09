const { MongoClient } = require('mongodb');

async function run() {
    const uri = 'mongodb+srv://db_user:db_user_password@cluster0.qcy69uq.mongodb.net/securecare_db';
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

    try {
        console.log("Connecting...");
        await client.connect();
        const db = client.db('securecare_db');
        const collection = db.collection('users');

        // Restore roles for all users based on their ID prefix if missing or wrong
        const users = await collection.find({}).toArray();
        let updatedCount = 0;

        for (const user of users) {
            let role = user.role;
            const prefix = user.userId ? user.userId.charAt(0).toUpperCase() : '';

            let expectedRole = '';
            if (prefix === 'A') expectedRole = 'ADMIN';
            else if (prefix === 'D') expectedRole = 'DOCTOR';
            else if (prefix === 'P') expectedRole = 'PATIENT';
            else if (prefix === 'N') expectedRole = 'NURSE';
            else if (prefix === 'L') expectedRole = 'LAB_TECHNICIAN';

            if (expectedRole && role !== expectedRole) {
                await collection.updateOne({ _id: user._id }, { $set: { role: expectedRole } });
                updatedCount++;
                console.log(`Restored role for ${user.userId}: ${role} -> ${expectedRole}`);
            }
        }

        console.log(`Finished. Updated ${updatedCount} users.`);
        process.exit(0);
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    } finally {
        await client.close();
    }
}
run();
