const mongoose = require('mongoose');
const path = require('path');
const UserSchema = new mongoose.Schema({
    userId: String,
    isOnline: Boolean,
    lastActive: Date
});
const User = mongoose.model('User', UserSchema);

async function run() {
    try {
        const uri = 'mongodb+srv://db_user:db_user_password@cluster0.qcy69uq.mongodb.net/securecare_db';
        console.log('Connecting to MongoDB...');
        await mongoose.connect(uri);
        console.log('Connected!');
        const res = await User.updateMany({}, { isOnline: false, lastActive: null });
        console.log('Update result:', res);
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}
run();
