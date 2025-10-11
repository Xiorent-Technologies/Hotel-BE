import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    // --- BASIC PROFILE INFO ---
    name: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    dateOfBirth: {
        type: String, // store as string (e.g. "12/12/1992") or use Date type if needed
    },
    country: {
        type: String,
    },
    city: {
        type: String,
    },
    homeAddress: {
        type: String,
    },
    // profileImg: {
    //     type: String, // URL from S3 or local upload
    // },
    image: {
        type: String, // Cloudinary URL
        default: "",
    },

    bio: {
        type: String,
    },
    

    // --- CONTACTS / SOCIAL LINKS ---
    contacts: {
        twitter: { type: String },
        facebook: { type: String },
        instagram: { type: String },
        phone: {
            type: String,
        },
    },

    // --- SECURITY SETTINGS ---
    twoFactorAuthEnabled: {
        type: Boolean,
        default: false,
    },
    twoFactorSecret: {
        type: String, // store 2FA secret for verification
    },
    reserveCodes: {
        type: [String], // backup login codes (6 of 10 left etc.)
    },
    passwordChangedAt: {
        type: Date,
    },

    // --- DEVICE & LOGIN ACTIVITY ---
    loginActivity: {
        lastLogin: {
            type: Date,
        },
        lastLoginIP: {
            type: String, // e.g. "198.123.23.23"
        },
        lastLoginDevice: {
            type: String, // e.g. "Chrome on Windows 10"
        },
    },
    activeDevices: [
        {
            deviceName: String, // e.g. 'iPhone 11'
            deviceType: String, // e.g. 'Mobile' or 'Desktop'
            location: String, // e.g. 'New Delhi, India'
            ipAddress: String,
            lastActive: Date,
            isActive: { type: Boolean, default: true },
        },
    ],

    // --- ACCOUNT STATUS ---
    role: {
        type: String,
        enum: ["user", "vendor", "admin"],
        default: "user",
    },
    isActive: {
        type: Boolean,
        default: true,
    },
},
    {
        timestamps: true, // adds createdAt, updatedAt
    });

const User = mongoose.model("User", userSchema);
export default User;