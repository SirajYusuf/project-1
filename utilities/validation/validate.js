const Joi = require('joi');
// var managerPermssionsSchema = Joi.object().keys({
//     roleName: Joi.string(),
//     permissions:Joi.array().default([])
// });
const schema = Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    role: Joi.string().valid('marketingmanager', 'operationmanager', 'superadmin').required(),
    username: Joi.string().required(),
    managerName: Joi.string().required(),
    mobileNumber: Joi.number().required(),
    balance: Joi.number(),
    // managerPermssions: managerPermssionsSchema
});
module.exports = schema
