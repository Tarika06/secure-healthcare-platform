const { MongoClient } = require('mongodb');

async function run() {
    const uri = 'mongodb+srv://db_user:db_user_password@cluster0.qcy69uq.mongodb.net/securecare_db';
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

    try {
        console.log("Connecting...");
        await client.connect();
        console.log("Connected!");
        const db = client.db('securecare_db');
        const users = await db.collection('users').find({ userId: /^A/ }).toArray();
        console.log(`Found ${users.length} admin-like users:`);
        users.forEach(u => console.log(`- ${u.userId}: role=${u.role}, isOnline=${u.isOnline}`));
        process.exit(0);
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    } finally {
        await client.close();
    }
}
run();
