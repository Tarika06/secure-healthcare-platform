const mongoose = require('mongoose');
const Alert = require('../models/Alert');
require('dotenv').config();

const seedAlerts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const alerts = [
            {
                type: 'SUSPICIOUS_LOGIN',
                severity: 'HIGH',
                description: 'Multiple failed login attempts detected from IP 192.168.1.105',
                recommendation: 'Block IP address temporarily and notify user.',
                status: 'OPEN',
                timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 mins ago
            },
            {
                type: 'UNAUTHORIZED_ACCESS',
                severity: 'MEDIUM',
                description: 'User ID N002 attempted to access restricted admin route /api/admin/users',
                recommendation: 'Review user roles and permissions.',
                status: 'INVESTIGATING',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
            },
            {
                type: 'ANOMALY',
                severity: 'LOW',
                description: 'Unusual access time for Doctor D001 (3:00 AM)',
                recommendation: 'Verify if this was a scheduled emergency shift.',
                status: 'RESOLVED',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
            }
        ];

        await Alert.deleteMany({}); // Clear existing to avoid duplicates if re-run
        await Alert.insertMany(alerts);

        console.log('Seeded 3 dummy alerts successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding alerts:', error);
        process.exit(1);
    }
};

seedAlerts();
