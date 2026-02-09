const mongoose = require('mongoose');
require('dotenv').config();

const MedicalRecord = require('./src/models/MedicalRecord');
const User = require('./src/models/User');
const Consent = require('./src/models/Consent');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const patientId = 'P002';

        const patient = await User.findOne({ userId: patientId });
        console.log(`Patient ${patientId}:`, patient ? 'Found' : 'Not Found');

        if (patient) {
            const records = await MedicalRecord.find({ patientId });
            console.log(`Records for ${patientId}:`, records.length);
            records.forEach(r => {
                console.log(` - Record ${r._id}: Created By ${r.createdBy}, Title: ${r.title}`);
            });

            const consents = await Consent.find({ patientId });
            console.log(`Consents for ${patientId}:`, consents.length);
            consents.forEach(c => {
                console.log(` - Consent ${c._id}: Doctor ${c.doctorId}, Status: ${c.status}`);
            });
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
