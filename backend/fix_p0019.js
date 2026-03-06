const mongoose = require('mongoose');
const User = require('./src/models/User');

const MONGO_URI = 'mongodb+srv://db_user:db_user_password@cluster0.qcy69uq.mongodb.net/securecare_db';
const NEW_HASH = '$2b$10$FRRDYyyhhzcbLQ5ZCR3KK.a7FYzpM1g1bBB7nf68mCKLvJpj1UBdm'; // Hash for 'Password123'

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const result = await User.updateOne(
            { userId: 'P0019' },
            { $set: { passwordHash: NEW_HASH } }
        );

        console.log('Update Result:', result);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

run();
