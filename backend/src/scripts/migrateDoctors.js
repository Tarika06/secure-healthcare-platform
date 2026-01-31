/**
 * Migration Script: Migrate existing doctors from users collection to doctors collection
 * Run this script once to create doctor profiles for all existing users with role DOCTOR
 * 
 * Usage: node src/scripts/migrateDoctors.js
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/securecare_db';

async function migrateDoctors() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find all users with role DOCTOR
        const doctorUsers = await User.find({ role: 'DOCTOR' });
        console.log(`📋 Found ${doctorUsers.length} doctor(s) in users collection`);

        if (doctorUsers.length === 0) {
            console.log('ℹ️  No doctors found to migrate');
            await mongoose.disconnect();
            return;
        }

        let migrated = 0;
        let skipped = 0;

        for (const user of doctorUsers) {
            // Check if doctor profile already exists
            const existingDoctor = await Doctor.findOne({ userId: user.userId });

            if (existingDoctor) {
                console.log(`⏭️  Skipping ${user.userId} - Doctor profile already exists`);
                skipped++;
                continue;
            }

            // Create new doctor profile with default values
            const doctorProfile = new Doctor({
                userId: user.userId,
                licenseNumber: `LIC-${user.userId}-${Date.now()}`, // Temporary license number
                specialization: 'General Medicine', // Default specialization
                qualifications: [{
                    degree: 'MBBS',
                    institution: 'Medical School',
                    year: 2020
                }],
                hospitalAffiliation: {
                    name: '',
                    address: '',
                    department: ''
                },
                professionalEmail: user.email || '',
                consultationFee: 500,
                consultationDuration: 30,
                yearsOfExperience: 0,
                bio: '',
                verificationStatus: 'PENDING',
                totalPatients: 0,
                totalConsultations: 0
            });

            await doctorProfile.save();
            console.log(`✅ Created doctor profile for ${user.userId} (${user.firstName} ${user.lastName})`);
            migrated++;
        }

        console.log('\n📊 Migration Summary:');
        console.log(`   - Total doctors found: ${doctorUsers.length}`);
        console.log(`   - Successfully migrated: ${migrated}`);
        console.log(`   - Skipped (already exists): ${skipped}`);

        await mongoose.disconnect();
        console.log('\n✅ Migration complete! Database disconnected.');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run the migration
migrateDoctors();
