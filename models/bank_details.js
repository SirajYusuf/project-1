const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');


const bankDetailsSchema = new mongoose.Schema({
    bankName: {
        type: String
    },
    email: {
        type: String, lowercase: true, required: [true, "can't be blank"], match: [/\S+@\S+\.\S+/, 'is invalid'], index: true, unique: true
    },
    ifscCode: {
        type: String
    },
    accountHolder: {
        type: String
    },
    accountNumber: {
        type: Number
    },
    branch: {
        type: String
    },
    balance: { type: Number }
}, {
    timestamps: { createdAt: true, updatedAt: true },
    versionKey: false
}
)

//Hiding Details
const bankDetails = mongoose.model("bank_details", bankDetailsSchema);


module.exports = bankDetails;



