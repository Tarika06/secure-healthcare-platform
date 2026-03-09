const mongoose = require('mongoose');
const path = require('path');
const UserSchema = new mongoose.Schema({
    userId: String,
    role: String
}, { strict: false });
const User = mongoose.model('User', UserSchema);

async function check() {
    const uri = 'mongodb+srv://db_user:db_user_password@cluster0.qcy69uq.mongodb.net/securecare_db';
    await mongoose.connect(uri);
    const admins = await User.find({ role: 'ADMIN' });
    console.log('Admins found:', admins.length);
    admins.forEach(a => console.log(`- ${a.userId}: role=${a.role}`));

    const all = await User.find({ userId: /^A/ });
    console.log('Users starting with A:', all.length);
    all.forEach(u => console.log(`- ${u.userId}: role=${u.role}`));

    process.exit(0);
}
check();
