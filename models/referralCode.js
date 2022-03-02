const mongoose = require('mongoose');
const Manager=require('../models/admin-users')
const {ObjectId} = mongoose.Schema.Types

const refSchema = new mongoose.Schema({
    managerId: {
        type: ObjectId,
    },
    managerName: {
        type: String
    },  
    referralCode: {
        type: String,
        unique: true,
        index:true,
        sparse:true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    role: {
        type: String
    }
},{
    timestamps: { createdAt: true, updatedAt: true },
    versionKey: false
})

const Referralcode = mongoose.model('Referralcode',refSchema)

module.exports = Referralcode