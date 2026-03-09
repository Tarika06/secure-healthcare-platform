require("dotenv").config();
const mongoose = require("mongoose");

const checkDbState = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const hot = await mongoose.connection.db.collection('medicalrecords').findOne({ patientId: 'P-TEST-999' });
        const cold = await mongoose.connection.db.collection('archivedrecords').findOne({ patientId: 'P-TEST-999' });
        console.log('---DB_STATE_START---');
        console.log(JSON.stringify({ inHot: !!hot, inCold: !!cold }));
        console.log('---DB_STATE_END---');
    } catch (error) {
        console.error("Error checking DB:", error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

checkDbState();
