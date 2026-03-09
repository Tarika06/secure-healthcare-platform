const { MongoClient } = require('mongodb');

async function run() {
    const uri = 'mongodb+srv://db_user:db_user_password@cluster0.qcy69uq.mongodb.net/securecare_db';
    const client = new MongoClient(uri);

    try {
        console.log("Connecting to MongoDB...");
        await client.connect();
        console.log("Connected!");

        const db = client.db('securecare_db');
        const collection = db.collection('users');

        const result = await collection.updateMany({}, {
            $set: {
                isOnline: false,
                lastActive: null
            }
        });

        console.log(`Updated ${result.modifiedCount} users.`);
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    } finally {
        await client.close();
    }
}

run();
