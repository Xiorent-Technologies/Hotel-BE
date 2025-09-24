import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    email: {
    type: String,
    required: true,
    },
    password: {
    type: String,
    required: true
    },
    role: {
    type: String,
    enum: ['user', 'vendor', 'admin'],
    default: 'user'
    },
    phone : {
        type : String,
    },
    profileImg : {
        type : String,
    },
    bio:{
        type : String,
    },
    // vendor
    vendorInfo : {
    businessName: String,
    taxId: String,
    bankAccount: {
        accountNumber: String,
        bankName: String,
        ifscCode: String
        },
    },
    isActive: { 
        type: Boolean,
        default: true 
    },
    lastLogin: Date
} , 
{
   timestamps: true
})

const User = mongoose.model("User", userSchema);
export default User;