
const jwt = require("jsonwebtoken");
const { secret } = require('config.json');
const User=require('../models/admin-users');
// const db = require("../models");
// const User = db.user;

verifyToken = async (req, res, next) => {
    try{
    let token = req.header('Authorization');

    if (!token) {
        return res.status(403).send({
            message: "No token provided!"
        });
    }

    const decode=jwt.verify(token, secret);
    const user= await User.findOne({_id:decode.id,'token':token});
   
    if (!user) {
        throw new Error()
    }
        req.role = decode.role;
        req.id = decode.id;
        req.user=user;
        next();
}
catch (e) {
    res.status(401).send({ 
        status:401,
        Message:"Session Timed Out.Please login again"
     })
}
    
};

isSuperAdmin = (req, res, next) => {
    console.log("@@@@@@@@@@@@@@@", req.role)
    if (req.role.toLowerCase() === "superadmin") {
        next();
        return;
    }
    res.status(400).send({
        status: 400,
        message: "Require Super Admin Role!"
    });
    return;

};

isMarketingManager = (req, res, next) => {
    if (req.role.toLowerCase() === "marketingmanager") {
        next();
        return;
    }
    res.status(400).send({
        status: 400,
        message: "Require Marketing Manager Role!"
    });
    return;
};

isOperationManager=(req,res,next)=>{
    if(req.role.toLowerCase()==='operationmanager')
    {
        next();
        return
    }
   res.status(400).send({
       status:400,
       message:"Require Operation Manager Role!"
   }) 
}

isMarketingManagerOrSuperAdmin = (req, res, next) => {
    if (req.role.toLowerCase() === "marketingmanager") {
        next();
        return;
    }

    if (req.role.toLowerCase() === "superadmin") {
        next();
        return;
    }
    res.status(400).send({
        status: 400,
        message: " Require superadmin or marketing manager Role!"
    });
    return
};

isOperationManagerOrSuperAdmin = (req, res, next) => {
    if (req.role.toLowerCase() === "operationmanager") {
        next();
        return;
    }

    if (req.role.toLowerCase() === "superadmin") {
        next();
        return;
    }
    res.status(400).send({
        status: 400,
        message: " Require superadmin or operation manager Role!"
    });
    return
};

const authorize = {
    verifyToken: verifyToken,
    isSuperAdmin: isSuperAdmin,
    isMarketingManager: isMarketingManager,
    isMarketingManagerOrSuperAdmin: isMarketingManagerOrSuperAdmin,
    isOperationManager:isOperationManager,
    isOperationManagerOrSuperAdmin:isOperationManagerOrSuperAdmin
};
module.exports = authorize;
