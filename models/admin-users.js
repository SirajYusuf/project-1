const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');


const adminUserSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        index: true,
        sparse: true,
        trim: true
    },
    email: {
        type: String, lowercase: true, required: [true, "can't be blank"], match: [/\S+@\S+\.\S+/, 'is invalid'], index: true, unique: true
    },
    emailVerified:{
        type:Boolean,
        defaut:true
    },
    verificationKey:{
        type:String
    },
    password: {
        type: String
    },
    passwordLastUpdated:{
        type:Date,
        default:Date.now()
    },
    mobileNumber: {
        type: Number,
        unique: true,
        index: true,
        sparse: true
    },
    role: {
        type: String,
        enum: ['marketingmanager', 'operationmanager','superadmin'],
        required: [true, "can't be blank"]
    },
  
    walletBalance: {
        type: Number,
        default: 0
    },
    userManagement: {
        type: Boolean,
        default: false
    },
    fundManagement: {
        type: Boolean,
        default: false
    },
    token: {
        type: String
    },
    lastLogin: {
        type: Date
    },
    referralCode:{
        type: String
    },
    usersCount:{
        type:Number,
        default:0   
    }
}, {
    timestamps: { createdAt: true, updatedAt: true },
    versionKey: false
}
)

//Hiding Details
adminUserSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();
    delete userObject.password;
    return userObject;

}

const User = mongoose.model("admin-user", adminUserSchema);

module.exports = User;



