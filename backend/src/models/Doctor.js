const mongoose = require("mongoose");

const DoctorSchema = new mongoose.Schema({
    // Link to User collection for authentication
    userId: {
        type: String,
        required: true,
        unique: true,
        ref: 'User'
    },

    // Professional Information
    licenseNumber: {
        type: String,
        required: true,
        unique: true
    },
    specialization: {
        type: String,
        required: true,
        enum: [
            'General Medicine',
            'Cardiology',
            'Dermatology',
            'Neurology',
            'Orthopedics',
            'Pediatrics',
            'Psychiatry',
            'Oncology',
            'Gynecology',
            'Ophthalmology',
            'ENT',
            'Radiology',
            'Pathology',
            'Anesthesiology',
            'Emergency Medicine',
            'Other'
        ]
    },

    // Qualifications
    qualifications: [{
        degree: { type: String, required: true },  // e.g., "MBBS", "MD", "MS"
        institution: { type: String, required: true },
        year: { type: Number, required: true }
    }],

    // Hospital/Clinic Affiliation
    hospitalAffiliation: {
        name: { type: String, default: '' },
        address: { type: String, default: '' },
        department: { type: String, default: '' }
    },

    // Contact Information (professional)
    professionalEmail: { type: String },
    professionalPhone: { type: String },

    // Consultation Details
    consultationFee: {
        type: Number,
        default: 0
    },
    consultationDuration: {
        type: Number,
        default: 30  // in minutes
    },

    // Availability Schedule
    schedule: {
        monday: { available: { type: Boolean, default: false }, hours: { start: String, end: String } },
        tuesday: { available: { type: Boolean, default: false }, hours: { start: String, end: String } },
        wednesday: { available: { type: Boolean, default: false }, hours: { start: String, end: String } },
        thursday: { available: { type: Boolean, default: false }, hours: { start: String, end: String } },
        friday: { available: { type: Boolean, default: false }, hours: { start: String, end: String } },
        saturday: { available: { type: Boolean, default: false }, hours: { start: String, end: String } },
        sunday: { available: { type: Boolean, default: false }, hours: { start: String, end: String } }
    },

    // Experience
    yearsOfExperience: {
        type: Number,
        default: 0
    },

    // Bio/About
    bio: {
        type: String,
        default: '',
        maxlength: 1000
    },

    // Verification Status
    verificationStatus: {
        type: String,
        enum: ['PENDING', 'VERIFIED', 'REJECTED'],
        default: 'PENDING'
    },
    verifiedAt: { type: Date },
    verifiedBy: { type: String },  // Admin userId who verified

    // Statistics
    totalPatients: {
        type: Number,
        default: 0
    },
    totalConsultations: {
        type: Number,
        default: 0
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save (Mongoose 9+ uses async instead of next callback)
DoctorSchema.pre('save', function() {
    this.updatedAt = new Date();
});

// Index for efficient queries
DoctorSchema.index({ specialization: 1 });
DoctorSchema.index({ verificationStatus: 1 });
DoctorSchema.index({ 'hospitalAffiliation.name': 1 });

module.exports = mongoose.model("Doctor", DoctorSchema);
