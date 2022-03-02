const mongoose = require('mongoose');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
const adminUserSchema = new mongoose.Schema({
    manager_id: {
        type: ObjectId
    },
    oldValue: {
        type: Number
    },
    newValue: {
        type: Number
    }
}, {
    timestamps: { createdAt: true, updatedAt: true },
    versionKey: false
}
)

const User = mongoose.model("admin-user", adminUserSchema);

module.exports = User;



