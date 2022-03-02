const User = require('../models/admin-users')
var bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const config = require('config.json');
const other = require('../config/mongooseOther')
// const userJoiSchema = require('../utilities/validation/validate')
const baseURL = '/betmaster/superadmin/api';
const sendeMail = require('../utilities/emailer/forgotPassword')
const sendVerifyEmail = require('../utilities/emailer/verifyEmail')
var ObjectId = require('mongodb').ObjectId;
const Referralcode = require('../models/referralCode');
const bankDetailsModel = require('../models/bank_details');
const { searchUtility, paginationUtility, sortingUtiliy } = require('../utilities/commonQueryUtils')
const { nanoid, customAlphabet } = require('nanoid')
const Joi = require('joi');
async function authenticate(req, res, next) {
    const UserData = await User.findOne({
        email: req.body.email
    })
    if (!UserData) {
        return res.status(400).send({
            status: 400,
            message: "Unable to find email."
        });
    }
    var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        UserData.password
    );
    if (!passwordIsValid) {
        return res.status(400).send({
            status: 400,
            message: "Invalid Password!"
        });
    }
    var token = jwt.sign({ id: UserData.id, role: UserData.role }, config.secret, {
        expiresIn: 86400 // 24 hours
    });
    const lastLogin = Date.now()
    UserData.lastLogin = lastLogin
    UserData.token = token;
    await UserData.save();
    res.status(200).send({
        status: 200,
        Message: "Login successful",
        Data: UserData
    });
}

async function getAll(req, res) {
    try {
        const query = await paginationUtility(req, res)
        const sorting = await sortingUtiliy(req, res)
        const totalPage = await other.UserCollection.find({ statusId: 3 }).countDocuments()
        const pages = totalPage / query.limit
        const user = await other.UserCollection.aggregate([
            {
                $match: {
                    statusId: 3
                }
            },
            {
                $lookup: {
                    from: 'referralcodes',
                    localField: 'referralCode',
                    foreignField: 'referralCode',
                    as: 'refData'
                }
            },
            { $unwind: '$refData' },
            {
                "$lookup": {
                    "from": "bet_orders",
                    "localField": "_id",
                    "foreignField": "customerId",
                    "as": "bets"
                }
            },
            {
                "$addFields": {
                    managerName: "$refData.managerName",
                    lostStatus: {
                        $filter: {
                            input: "$bets.betStatus",
                            as: "wins",
                            cond: {
                                $eq: [
                                    "$$wins",
                                    4
                                ]
                            },

                        }
                    },
                    wonStatus: {
                        $filter: {
                            input: "$bets.betStatus",
                            as: "wins",
                            cond: {
                                $eq: [
                                    "$$wins",
                                    3
                                ]
                            },

                        }
                    }
                }
            },
            {
                $project: {
                    walletBalance: 1,
                    createdAt: 1,
                    nickName: 1,
                    referralCode: 1,
                    userName: 1,
                    managerName: 1,
                    totalWin: {
                        $cond: {
                            if: {
                                $isArray: "$wonStatus"
                            },
                            then: {
                                $size: "$wonStatus"
                            },
                            else: "NA"
                        }
                    },
                    totalLost: {
                        $cond: {
                            if: {
                                $isArray: "$lostStatus"
                            },
                            then: {
                                $size: "$lostStatus"
                            },
                            else: "NA"
                        }
                    }
                }

            },
            { $sort: sorting },
            { $limit: query.limit + query.skip },
            { $skip: query.skip },

        ]).then((data) => {
            if (data == 0) {
                return res.status(200).send({
                    status: 200,
                    message: "No users found",
                    Data: data,
                    totalPages: Math.ceil(pages),
                    currentPage: parseInt(query.page),
                    NumberOfDocuments: totalPage
                })
            }
            return res.status(200).send({
                status: 200,
                message: "Success",
                Data: data,
                totalPages: Math.ceil(pages),
                currentPage: parseInt(query.page),
                NumberOfDocuments: totalPage
            })
        })
    } catch (e) {
        console.log(e)
        res.status(500).send({
            status: 500,
            message: "Due to technical issues something went wrong.Try again"
        })
    }
}

async function getBlockedUsers(req, res) {
    try {
        const query = await paginationUtility(req, res)
        const sorting = await sortingUtiliy(req, res)
        const searchText = req.body.searchText
        const documents = await other.UserCollection.find({ statusId: 4 }).countDocuments()
        var aggregation = [
            {
                $match: {
                    statusId: 4
                }
            },
            { "$match": { "userName": { "$in": [new RegExp(searchText)] } } },
            {
                $lookup: {
                    from: 'referralcodes',
                    localField: 'referralCode',
                    foreignField: 'referralCode',
                    as: 'refData'
                }
            },
            { $unwind: '$refData' },
            {
                "$lookup": {
                    "from": "bet_orders",
                    "localField": "_id",
                    "foreignField": "customerId",
                    "as": "bets"
                }
            },
            {
                "$addFields": {
                    managerName: "$refData.managerName",
                    lostStatus: {
                        $filter: {
                            input: "$bets.betStatus",
                            as: "wins",
                            cond: {
                                $eq: [
                                    "$$wins",
                                    4
                                ]
                            },

                        }
                    },
                    wonStatus: {
                        $filter: {
                            input: "$bets.betStatus",
                            as: "wins",
                            cond: {
                                $eq: [
                                    "$$wins",
                                    3
                                ]
                            },
                        }
                    }
                }
            },
            {
                $project: {
                    walletBalance: 1,
                    createdAt: 1,
                    nickName: 1,
                    referralCode: 1,
                    userName: 1,
                    managerName: 1,
                    totalWin: {
                        $cond: {
                            if: {
                                $isArray: "$wonStatus"
                            },
                            then: {
                                $size: "$wonStatus"
                            },
                            else: "NA"
                        }
                    },
                    totalLost: {
                        $cond: {
                            if: {
                                $isArray: "$lostStatus"
                            },
                            then: {
                                $size: "$lostStatus"
                            },
                            else: "NA"
                        }
                    }
                }

            }
        ]
        var aggregationPaginated = aggregation.slice(0);
        aggregation.push({
            $group: {
                _id: null,
                count: { $sum: 1 }
            }
        });
        aggregationPaginated.push({
            $sort: sorting
        });
        aggregationPaginated.push({
            $limit: query.skip + query.limit
        },
            {
                $skip: query.skip
            })
        const data = await other.UserCollection.aggregate(aggregation)
        if (data == 0) {
            return res.status(200).send({
                status: 200,
                message: "No users found",
                Data: data,
                totalPages: Math.ceil(data.length / query.limit),
                currentPage: parseInt(query.page),
                filteredDocuments: data.length,
                documents: documents
            })
        }
        else {
            var numFiltered = data[0].count;
            await other.UserCollection.aggregate(aggregationPaginated).then((data) => {
                if (data == 0) {
                    return res.status(200).send({
                        status: 200,
                        message: "No users found",
                        Data: data,
                        totalPages: Math.ceil(data.length / query.limit),
                        currentPage: parseInt(query.page),
                        filteredDocuments: data.length,
                        documents: documents
                    })
                }
                else {
                    return res.status(200).send({
                        status: 200,
                        message: "Success",
                        Data: data,
                        totalPages: Math.ceil(numFiltered / query.limit),
                        currentPage: parseInt(query.page),
                        filteredDocuments: numFiltered,
                        documents: documents
                    });
                }
            });
        }
    } catch (e) {
        console.log(e)
        res.status(500).send({
            status: 500,
            message: "Due to technical issues something went wrong.Try again"
        })
    }

}

async function searchUser(req, res) {
    try {
        const query = await paginationUtility(req, res)
        const search = req.body.searchText
        const searchUtils = await searchUtility(req, res)
        const sorting = await sortingUtiliy(req, res)
        if (!req.body.blocked) {
            var statusId = 3
        } else {
            var statusId = 4
        }
        const totalPage = await other.UserCollection.find({ statusId }).where(searchUtils)
        const pages = totalPage.length / query.limit
        await other.UserCollection.aggregate([
            {
                $match: {
                    statusId: statusId
                }
            },
            {
                $match: {
                    $or: [{ nickName: search }, { userName: search }]
                }
            },
            {
                $lookup: {
                    from: 'referralcodes',
                    localField: 'referralCode',
                    foreignField: 'referralCode',
                    as: 'refData'
                }
            },
            { $unwind: '$refData' },
            {
                "$lookup": {
                    "from": "bet_orders",
                    "localField": "_id",
                    "foreignField": "customerId",
                    "as": "bets"
                }
            },
            {
                "$addFields": {
                    managerName: "$refData.managerName",
                    lostStatus: {
                        $filter: {
                            input: "$bets.betStatus",
                            as: "wins",
                            cond: {
                                $eq: [
                                    "$$wins",
                                    4
                                ]
                            },

                        }
                    },
                    wonStatus: {
                        $filter: {
                            input: "$bets.betStatus",
                            as: "wins",
                            cond: {
                                $eq: [
                                    "$$wins",
                                    3
                                ]
                            },

                        }
                    }
                }
            },
            {
                $project: {
                    walletBalance: 1,
                    createdAt: 1,
                    nickName: 1,
                    referralCode: 1,
                    userName: 1,
                    managerName: 1,
                    totalWin: {
                        $cond: {
                            if: {
                                $isArray: "$wonStatus"
                            },
                            then: {
                                $size: "$wonStatus"
                            },
                            else: "NA"
                        }
                    },
                    totalLost: {
                        $cond: {
                            if: {
                                $isArray: "$lostStatus"
                            },
                            then: {
                                $size: "$lostStatus"
                            },
                            else: "NA"
                        }
                    }
                }

            },
            { $sort: sorting },
            { $limit: query.limit + query.skip },
            { $skip: query.skip },

        ]).then((data) => {
            if (data == 0) {
                return res.status(200).send({
                    status: 200,
                    message: "No users found",
                    Data: data,
                    totalPages: Math.ceil(pages),
                    currentPage: parseInt(query.page),
                    NumberOfDocuments: totalPage.length
                })
            }
            return res.status(200).send({
                status: 200,
                message: "Success",
                Data: data,
                totalPages: Math.ceil(pages),
                currentPage: parseInt(query.page),
                NumberOfDocuments: totalPage.length
            })
        })
    } catch (e) {
        console.log(e)
        res.status(500).send({
            status: 500,
            message: "Due to technical issues something went wrong.Try again"
        })
    }
}

async function searchManager(req, res) {
    try {
        const query = await paginationUtility(req, res)
        const search = req.body.searchText
        const manager = await User.find({ $or: [{ role: 'operationmanager' }, { role: 'marketingmanager' }] }).where({ username: search })
        if (!manager) {
            res.status(200).send({
                status: 200,
                message: "No users found",
                Data: manager,
                totalPages: Math.ceil(manager.length / query.limit),
                currentPage: parseInt(query.page),
                NumberOfDocuments: manager.length
            })
        } else {
            res.status(200).send({
                status: 200,
                message: "No users found",
                Data: manager,
                totalPages: Math.ceil(manager.length / query.limit),
                currentPage: parseInt(query.page),
                NumberOfDocuments: manager.length
            })
        }
    } catch (err) {
        console.log(err)
        res.status(500).send({
            status: 500,
            message: "Due to technical issues something went wrong.Try again"
        })
    }
}

const getAllManagers = async (req, res) => {
    try {
        const filter = req.body.filter
        const query = await paginationUtility(req, res)
        const sorting = await sortingUtiliy(req, res)
        const totalManagers = await User.find({ $or: [{ role: 'operationmanager' }, { role: 'marketingmanager' }] }).countDocuments()
        var d = new Date();
        d.setMonth(d.getMonth() - 1);
        const activeUsers = await User.find({
            $and: [{
                $or: [{ role: 'operationmanager' }, { role: 'marketingmanager' }]
            },
            { lastLogin: { $gte: d } }
            ]
        }).countDocuments()
        const inActiveUsers = await User.find({
            $and: [{
                $or: [{ role: 'operationmanager' }, { role: 'marketingmanager' }]
            },
            { lastLogin: { $lte: d } }
            ]
        }).countDocuments()
        var findQuery = {}
        if (!filter) {
            findQuery = {
                $or: [
                    { role: 'operationmanager' }, { role: 'marketingmanager' }
                ]
            }
        }
        if (filter === "active") {
            findQuery = {
                $or: [
                    { role: 'operationmanager' }, { role: 'marketingmanager' }
                ],
                lastLogin: { $gte: d }
            }
        }
        if (filter === "inactive") {
            findQuery = {
                $or: [
                    { role: 'operationmanager' }, { role: 'marketingmanager' }
                ],
                lastLogin: { $lte: d }
            }
        }
        const data = await User.find(findQuery).limit(query.limit).skip(query.skip).sort(sorting)
        const filteredDocuments = await User.find(findQuery).countDocuments()
        if (data == 0) {
            return res.status(200).send({
                status: 200,
                message: "No users found",
                Data: data,
                totalPages: Math.ceil(filteredDocuments / query.limit),
                currentPage: parseInt(query.page),
                NumberOfDocuments: totalManagers,
                activeUsers,
                inActiveUsers
            })
        }
        return res.status(200).send({
            status: 200,
            message: "Success",
            Data: data,
            totalPages: Math.ceil(filteredDocuments / query.limit),
            currentPage: parseInt(query.page),
            NumberOfDocuments: totalManagers,
            activeUsers,
            inActiveUsers
        })
    } catch (e) {
        console.log(e)
        res.status(500).send({
            status: 500,
            message: "Due to technical issues something went wrong.Try again"
        })
    }
}

const updateManagerName = async (req, res) => {
    try {
        const checkUserName = await userNameExist(req.body.username)
        if (checkUserName) {
            return res.status(403).send({
                status: 403,
                message: "This name is already taken"
            })
        }
        await User.findOneAndUpdate({ _id: req.body.id }, { $set: { username: req.body.username } }, { new: true })
            .then((data) => {
                res.status(200).send({
                    status: 200,
                    message: 'manager name has been updated.'
                })
            })
    }
    catch (e) {
        console.log(e)
        res.status(500).send({
            status: 500,
            message: 'Due to technical issue something went wrong.Try again'
        })
    }
}

const updateManagerEmail = async (req, res) => {
    try {
        const checkUserExist = await IsExistUser(req.body.email)
        const email = req.body.email
        if (checkUserExist) {
            return res.status(403).json({
                status: 403,
                message: "This email is already registered with another user!",
            })
        }
        const hashEmail = await bcrypt.hash(email, 8)
        const link = `${config.siteUrl}/VerifyEmail?key=${hashEmail}`
        const result = await sendVerifyEmail(email, link)
        if (result === 200) {
            await User.findOneAndUpdate({ _id: req.body.id },{$set: {email:req.body.email ,emailVerified:false,verificationKey:hashEmail}})
            .then((data) => {
                res.status(200).send({
                    status: 200,
                    message: 'Email has been successfully updated'
                })
            }).catch((err)=>{
                console.log(err)
                res.status(500).send({
                    status: 500,
                    message: "something went wrong.Please try again"
                })
            })
        } else {
            res.status(500).send({
                status: 500,
                message: "something went wrong.Please try again"
            })
        }
    }
    catch (e) {
        console.log(e)
        res.status(500).send({
            status: 500,
            message: 'Due to technical issue something went wrong.Try again'
        })
    }
}

const verifyEmail = async(req,res)=>{
   try{
    const verificationKey = req.query.key
    const verifyUser = await User.findOne({verificationKey})
    if(verifyUser){
        await User.findOneAndUpdate({_id:verifyUser._id},{
            $unset: {
               verificationKey:verifyUser.verificationKey
            }, 
            $set: {
                emailVerified:true
            }
        })
        res.status(200).json({
            message:'Email successfully verified.You can close this tab now'
        })
    }else{
        res.status(400).json({
            status:400,
            message:'Email already verified'
        })
    }
   }
   catch(err){
    console.log(err)
    res.status(500).json({
        status:500,
        message:'Due to technical issue something went wrong.Try again'
    })
   }
}

async function getById(req, res, next) {
    try {
        const resDb = await req.app.locals.db.collection('users').findOne({ _id: ObjectId(req.params.id) })
        const refManager = await req.app.locals.db.collection('referralcodes').findOne({ referralCode: resDb.referralCode })

        const wins = await req.app.locals.db.collection("bet_orders").find({ customerId: new ObjectId(req.params.id), betStatus: 3 }).count();
        const losts = await req.app.locals.db.collection("bet_orders").find({ customerId: new ObjectId(req.params.id), betStatus: 4 }).count();

        resDb.winsCount = wins;
        resDb.lostCount = losts;

        if (!resDb) {
            return res.status(404).send({
                status: 404,
                message: "User does not exist!"
            })
        }
        resDb.managerName = refManager.managerName
        return res.status(200).send({
            status: 200,
            message: 'success',
            Data: resDb
        })
    } catch (e) {
        console.log("error:", e)
        res.status(500).send({
            status: 500,
            message: "Due to technical issues something went wrong.Try again "
        })
    }

}

async function UpdateUserByID(req, res, next) {
    try {
        const payload = req.body;
        const resDb = await req.app.locals.db.collection('users').updateOne({ _id: ObjectId(req.params.id) }, { $set: payload })
        return res.status(200).send({
            status: 200,
            message: 'upadte succesfully',
        })
    } catch (e) {
        console.log("error", e)
        res.status(500).send({
            status: 500,
            message: "Due to technical issues something went wrong.Try again "
        })
    }

}

async function getByManagerId(req, res) {
    try {
        const resDb = await req.app.locals.db.collection('admin-users').findOne({ _id: ObjectId(req.params.id) })
        const referralDb = await req.app.locals.db.collection('referralcodes').findOne({ $and: [{ managerId: ObjectId(req.params.id) }, { isActive: true }] })
        var w = new Date();
        w.setDate(w.getDate() - 7)
        const newUsers = await other.UserCollection.find({ createdAt:{$gte:w}}).countDocuments()
        resDb.newUsers = newUsers
        if (!resDb) {
            return res.status(404).send({
                status: 404,
                message: "Manager does not exist!"
            })
        }
        if (!referralDb) {
            resDb.referralCode = '--'
            res.status(200).send({
                status: 200,
                message: 'success',
                Data: resDb
            })
        }
        else {
            resDb.referralCode = referralDb.referralCode
            return res.status(200).send({
                status: 200,
                message: 'success',
                Data: resDb
            })
        }
    } catch (e) {
        console.log("################", e)
        res.status(500).send({
            status: 500,
            message: "Due to technical issues something went wrong.Try again "
        })
    }
}


//Deleting the user
async function removeUser(req, res, next) {
    try {

        const checkUserBalance = await req.app.locals.db.collection('users').findOne({ _id: new ObjectId(req.params.id) });
        console.log("user", checkUserBalance)

        if (checkUserBalance.walletBalance == 0) {
            await req.app.locals.db.collection("userdeposits").remove({ userId: new ObjectId(req.params.id) });
            await req.app.locals.db.collection("userwithdrawls").remove({ userId: new ObjectId(req.params.id) });
            await req.app.locals.db.collection("bet_orders").remove({ customerId: new ObjectId(req.params.id) });

            //    const data= await req.app.locals.db.collection('referralcodes').findOne({referralCode:checkUserBalance.referralCode})

            await req.app.locals.db.collection('users').deleteOne({ userName: checkUserBalance.userName }).then(() => {


                res.status(200).send({
                    status: 200,
                    message: "User deleted successfully"
                })

            }).catch(err => {
                res.status(400).send({
                    status: 400,
                    message: "unable to delete the user"
                })
            })

        }
        else if (checkUserBalance.walletBalance > 0) {
            return res.status(400).send({
                status: 400,
                Message: "To delete the user,their wallet balance should be empty"
            })
        }

    }
    catch (err) {
        console.log(err)
        res.status(500).send({ status: 500, message: "Due to technical issues something went wrong.Try again " })
    }
}


//updating user
async function updateUser(req, res, next) {
    await req.app.locals.db.collection('users').updateOne({ _id: ObjectId(req.params.id) })
    res.status(200).json({ message: "User updated successfully" })
}

//Blocking User 
async function blockUser(req, res) {
    try {
        const userArray = req.body;
        await other.UserCollection.updateMany({ userName: { $in: userArray } }, { $set: { statusId: 4 } }).then((data) => {
            res.status(200).send({
                status: 200,
                message: "User blocked successfully"
            })
        }).catch(err => {
            res.status(400).send({
                status: 400, message: "Unable to block the user"
            })
        })

    }
    catch (err) {
        res.status(500).send({ status: 500, message: 'Due to technical issues something went wrong.Try again' })
    }
}

//unblocking users
async function unblockUser(req, res) {
    try {
        const userArray = req.body;
        await other.UserCollection.updateMany({ userName: { $in: userArray } }, { $set: { statusId: 3 } }).then((data) => {
            res.status(200).send({
                status: 200,
                message: "User unblocked successfully"
            })
        }).catch(err => {
            res.status(400).send({
                status: 400, message: "Unable to unblock the user"
            })
        })

    }
    catch (err) {
        res.status(500).send({ status: 500, message: 'Due to technical issues something went wrong.Try again' })
    }

}

async function createUser(req, res) {
    try {
        const checkUserName = await userNameExist(req.body.username)
        if (checkUserName) {
            return res.status(400).send({
                status: 400,
                message: "Username is taken"
            })
        }
        const checkUserExist = await IsExistUser(req.body.email)
        if (checkUserExist) {
            return res.status(403).json({
                status: 403,
                message: "Email already exist",
            })
        }
        const checkMobileRegistration = await IsMobileNumberRegistered(req.body.mobileNumber)
        if (checkMobileRegistration) {
            return res.status(403).send({
                status: 403,
                message: 'This mobile number is already registered'
            })
        }
        const user = new User({
            username: req.body.username,
            email: req.body.email,
            role: req.body.role,
            mobileNumber: req.body.mobileNumber,
            userManagement: req.body.userManagement,
            fundManagement: req.body.fundManagement,
            password: await bcrypt.hash(req.body.password, 8)
        });

        const data = await User.create(user)
        return res.status(200).send({
            status: 200,
            message: "successfully created",
            isUserCreated: true,
            Data: data
        })

    } catch (err) {
        console.log("@@@@@@@@@@createUser@@@@@@@@", err)
        return res.status(500).json({
            status: 500,
            message: 'Due to technical issues something went wrong. Try again'
        })
    }
};

const IsExistUser = async (emailid) => {
    try {
        const userResp = await User.findOne({ email: emailid })
        if (!userResp)
            return false
        else
            return true
    } catch (err) {
        console.log("@@@@@@@@@@IsExistUser@@@@@@@@", err)
    }

}

const IsMobileNumberRegistered = async (mobileNumber) => {
    try {
        const userResp = await User.findOne({ mobileNumber })
        if (!userResp)
            return false
        else
            return true
    } catch (err) {
        console.log("@@@@@@@@@@isMobileNumberRegistered@@@@@@@", err)
    }
}

const userNameExist = async (username) => {
    try {
        const userResp = await User.findOne({ username })
        if (!userResp)
            return false
        else
            return true
    } catch (err) {
        console.log("@@@@@@@@@@ username is already taken @@@@@@@", err)
    }
}

const forgotPassword = async (req, res, next) => {
    try {
        const email = req.body.email
        const user = await User.findOne({ email })
        if (!user) {
            res.status(400).send({
                status: 400,
                message: 'Your email is not registered'
            })
        } else {
            var tokenObject = {
               userId:user.username
            }
            var token = jwt.sign(tokenObject, config.secret, { expiresIn: '30m' })
            const link = `${config.siteUrl}/updatePassword?token=${token}`
            const result = await sendeMail(email, link)
            if (result == 200) {
                res.status(200).send({
                    status: 200,
                    message: "email sent successfully"
                })
            } else {
                res.status(500).send({
                    status: 500,
                    message: "something went wrong"
                })
            }
        }
    }
    catch (err) {
        res.status(500).send({
            err: err,
            status: 500,
            message: 'Due to technical issue something went wrong.Try again'
        })
    }
}

const verifyResetToken = async (req, res, next) => {
    try {
        const token = req.query.token
        const decoded = jwt.verify(token, config.secret)
        const userDecoded = await User.findOne({ username: decoded.userId })
        if (userDecoded.passwordLastUpdated/1000 <= decoded.iat) {
            const hashPassword = await bcrypt.hash(req.body.password, 8)
            await User.findOneAndUpdate({ username: decoded.userId }, { $set: { password: hashPassword,passwordLastUpdated:Date.now()}},{ new: true }).then((data)=>{
                res.status(200).send({
                    status: 200,
                    message: "Your password has been successfully updated."
                })
            })
            
        }else{
            res.status(400).send({
                status: 400,
                message: 'You have already reset your password, please go ahead and login'
            })
        }
    }
    catch (e) {
        console.log(e)
        res.status(500).send({
            status: 500,
            message: 'your link has expired'
        })
    }
}

const resetPassword = async (req, res) => {
    try {
        const hashPassword = await bcrypt.hash(req.body.password, 8)
        await User.findOneAndUpdate({ _id: req.body.id }, { $set: { password: hashPassword } }, { new: true })
            .then((data) => {
                res.status(200).send({
                    status: 200,
                    message: 'Your password has been successfully updated.'
                })
            })
    }
    catch (e) {
        console.log(e)
        res.status(500).send({
            status: 500,
            message: 'Due to technical issue something went wrong.Try again'
        })
    }
}

const createReferralById = async (req, res) => {
    try {
        const results = await Referralcode.findOne({ managerId: req.body.id })
        if (!results) {
            const user = await User.findOne({ _id: req.body.id })
            console.log(user)
            const nanoid = customAlphabet('1234567890ABCDEFGH#$^&@*', 10)
            const code = 'betmaster' + nanoid()
            const referral = new Referralcode({
                role: user.role,
                managerId: user.id,
                referralCode: code,
                managerName: user.username
            })
            const inserted = await referral.save()
            res.status(201).send({
                status: 201,
                'referralCode': inserted.referralCode,
                'isActive': inserted.isActive,
                message: "new referral code is created"
            })
        }
        else {
            const update = await Referralcode.find({ managerId: req.body.id }).sort({ createdAt: -1 }).limit(1)
            update[0].isActive = false
            await update[0].save()
            const user = await User.findOne({ _id: req.body.id })
            const nanoid = customAlphabet('1234567890ABCDEFGH#$^&@*', 10)
            const code = 'betmaster' + nanoid()
            const referral = new Referralcode({
                role: user.role,
                managerId: user.id,
                referralCode: code,
                managerName: user.username
            })
            const inserted = await referral.save()
            res.status(200).send({
                status: 200,
                'referralCode': inserted.referralCode,
                'isActive': inserted.isActive,
                message: 'referral code is generated'
            })
        }
    } catch (e) {
        console.log(e)
        res.status(500).send({
            status: 500,
            msg: "due to technical issue something went wrong!"
        })
    }
}

async function getRefferedUsers(req, res) {
    try {
        const query = await paginationUtility(req, res)
        const resDb = await req.app.locals.db.collection('referralcodes').find({ managerId: ObjectId(req.id) }).limit(query.limit).skip(query.skip).toArray()
        if (resDb.length === 0) {
            return res.status(404).send({
                status: 404,
                msg: "Records not found",

            })
        }
        const allRefCodesUserArray = []
        for (const refCodeObj of resDb) {
            const userArray = await req.app.locals.db.collection('users').find({ referralCode: refCodeObj.referralCode }).toArray()
            for (const user of userArray) {
                allRefCodesUserArray.push(user)
            }
        }
        res.status(200).send({
            status: 200,
            msg: "Success",
            data: allRefCodesUserArray
        })
    }
    catch (e) {
        res.status(500).send({
            status: 500,
            msg: "Due to techincal issues something went wrong"
        })
    }

}

//Approving UserDepositsRequest by Id
const approveUserDepositRequest = async (req, res) => {
    try {
        const amount = req.body.amount;
        const id = req.body._id;


        const managerBalance = req.user.walletBalance;

        if ((managerBalance < amount)) {
            res.status(400).send({ status: 400, message: "Insufficient funds .Try again" })
        }
        else {

            newBalance = managerBalance - amount
            await req.app.locals.db.collection('userdeposits').updateOne({ _id: new ObjectId(id) }, { $set: { transactionStatus: "processed", receivedDate: new Date(Date.now()), settledBy: new ObjectId(req.id) } })
            await User.findOneAndUpdate({ _id: req.id }, { $set: { walletBalance: newBalance } })
            await req.app.locals.db.collection('users').updateOne({ _id: new ObjectId(req.body.userId) }, { $inc: { walletBalance: amount } }).then(data => {
                res.status(200).send({
                    status: 200,
                    message: "Funds transferred successfully"
                })
            }).catch(err => {
                res.status(400).send({
                    status: 400,
                    message: "unable to transfer funds try again"
                })
            })
        }
    }
    catch (err) {
        res.status(500).send({
            status: 500,
            message: "Due to tecnical issues something went wrong.Try again"
        })
    }
}

//Approve User Withdraw Requests
const approveUserWithdrawRequest = async (req, res) => {
    try {


        const updates = {

            transactionStatus: "processed",
            transactionTime: "2-3 working days",
            transactionId: req.body.transactionId,
            settledBy: new ObjectId(req.id)

        }

        await req.app.locals.db.collection('userwithdrawls').updateOne({ _id: new ObjectId(req.body._id) }, { $set: updates }).then(data => {
            res.status(200).send({
                status: 200,
                Message: "Successfully updated"
            })

        }).catch(err => {
            res.status(400).send({
                status: 400,
                message: "Unable to process.Try again"
            })
        })



    }
    catch (err) {

        res.status(500).send({ status: 500, message: "Due to technical issues something went wrong.Try again later" })
    }
}

//Getting user withdraw requests by ID
const getUserDepositRequestById = async (req, res) => {
    try {


        const resDb = await req.app.locals.db.collection("userdeposits").findOne({ _id: new ObjectId(req.body._id) })

        if (!resDb) {
            return res.status(400).send({ status: 400, message: "user does not exist" })
        }
        else {
            const user = await req.app.locals.db.collection("users").findOne({ _id: resDb.userId })
            if (user)
                resDb.userRegisteredBankNumber = user.bankNumber,
                    resDb.userRegisteredBankName = user.bankName,
                    resDb.userRegisteredAccountHolderName = user.accountHolderName

            const managerData = await req.app.locals.db.collection("referralcodes").findOne({ referralCode: user.referralCode })
            if (managerData) {
                resDb.managerId = managerData.managerId,
                    resDb.managerName = managerData.managerName

                return res.status(200).send({ status: 200, Data: resDb })
            }


        }

    }
    catch (err) {
        console.log(err)
        res.status(500).send({
            status: 500,
            message: "Due to technical issues something went wrong.Try again"
        })
    }

}

//Get User Withdrawls By Id
const getUserWithdrawlRequestsById = async (req, res) => {
    try {


        const resDb = await req.app.locals.db.collection("userwithdrawls").findOne({ _id: new ObjectId(req.body._id) })

        if (!resDb) {
            return res.status(400).send({ status: 400, message: "user does not exist" })
        }
        else {
            const user = await req.app.locals.db.collection("users").findOne({ _id: resDb.userId })
            if (user)
                resDb.userRegisteredBankNumber = user.bankNumber,
                    resDb.userRegisteredBankName = user.bankName,
                    resDb.userRegisteredAccountHolderName = user.accountHolderName

            const managerData = await req.app.locals.db.collection("referralcodes").findOne({ referralCode: user.referralCode })
            if (managerData) {
                resDb.managerId = managerData.managerId,
                    resDb.managerName = managerData.managerName

                return res.status(200).send({ status: 200, Data: resDb })
            }


        }

    }
    catch (err) {
        res.status(500).send({ status: 500, message: "Due to technical issues something went wrong.Try again" })
    }

}

//Logout module
const logout = async (req, res) => {
    try {
        const user = req.user;
        await User.findOneAndUpdate({ _id: user._id }, { $unset: { token: user.token } }).then((data) => {

            res.status(200).send({ status: 200, isLoggedOut: true, message: "Logout successfully" })
        }).catch(err => {
            re.status(400).send({ status: 400, isLoggedOut: false, message: "Unable to logout.Try again" })
        })
    }
    catch (err) {
        res.status(500).send({ status: 500, message: " Due to technical issues something went wrong.Try again" })
    }
}

const balanceCheck = async (req, res, next) => {
    var payloadAmount = req.body.amount;
    payloadAmount = parseFloat(payloadAmount);
    if (isNaN(payloadAmount)) {
        return res.status(500).json({ status: 500, message: "Something went wrong" });
    }
    try {
        const userDetails = await req.app.locals.db.collection('users').findOne({ _id: ObjectId(req.params.id) }, { "walletBalance": 1 })
        if (userDetails) {
            var current_balance = parseFloat(userDetails.walletBalance).toFixed(12);
            if (current_balance < payloadAmount) {
                return res.status(400).send({
                    status: 400,
                    Message: 'Please make a deposit and try again.'
                })
            } else {
                console.log('userDetails', { haveBal: true, details: userDetails })
                return { haveBal: true, details: userDetails };
            }
        } else {
            return res.status(404).send({
                status: 404,
                message: 'user not found',
            })
        }
    } catch (err) {
        return res.status(500).json({ status: 500, message: "Something went wrong" });
    }
};

// 
async function BalanceDeductByID(req, res, next) {
    try {
        const payloadAmount = parseInt(req.body.amount);
        const checkBal = await balanceCheck(req, res)
        console.log("@@@@@@@@@@@@@", checkBal)
        if (checkBal.haveBal) {
            const resultOfDeduction = checkBal.details.walletBalance - payloadAmount
            console.log('&&&&&&&&&&&&')
            const deductingfromUser = await req.app.locals.db.collection('users').updateOne({ _id: ObjectId(req.params.id) }, { $set: { walletBalance: resultOfDeduction } })
            const addedToSuperAdmin = await bankDetailsModel.updateOne({ _id: ObjectId('61b191ce998a801f68cc63e6') }, { $inc: { balance: resultOfDeduction } })
            return res.status(200).send({
                status: 200,
                message: 'update succesfully',
            })
        }
    } catch (e) {
        console.log("################", e)
        res.status(500).send({
            status: 500,
            message: "Due to technical issues something went wrong.Try again "
        })
    }

}

async function BalanceTransferByID(req, res, next) {
    try {
        const payloadAmount = parseInt(req.body.amount);
        const addingToUser = await req.app.locals.db.collection('users').updateOne({ _id: ObjectId(req.params.id) }, { $inc: { walletBalance: payloadAmount } })
        console.log('result', addingToUser)
        const getSuperAdminWallet = await bankDetailsModel.findOne({ _id: ObjectId('61b191ce998a801f68cc63e6') })
        const result = getSuperAdminWallet.balance - payloadAmount
        console.log('result', result)
        const addedToSuperAdmin = await bankDetailsModel.updateOne({ _id: ObjectId('61b191ce998a801f68cc63e6') }, { $set: { balance: result } })
        console.log('addedToSuperAdmin', addedToSuperAdmin)
        return res.status(200).send({
            status: 200,
            message: 'upadte succesfully',
        })
    } catch (e) {
        console.log('error:', e)
        res.status(500).send({
            status: 500,
            message: "Due to technical issues something went wrong.Try again "
        })
    }

}
async function userActivityController(req, res, next) {
    const schemaRules = {
        activity: Joi.string().required(),
        customerId: Joi.string().required(),
        size: Joi.number(),
        page: Joi.number(),
        fromDate: Joi.date(),
        toDate: Joi.date().greater(Joi.ref('fromDate'))
    };
    const schema = Joi.object(schemaRules)
    const { error, value } = schema.validate(req.body);

    if (error) {
        return res.status(400).send({
            status: 400,
            message: "invalid input"
        })
    }
    let data;
    const query = await paginationUtility(req, res)
    let dbQuery;
    if (req.body.activity === "sports") {
        dbQuery = { customerId: new ObjectId(req.body.customerId) }
    } else {
        dbQuery = { userId: new ObjectId(req.body.customerId) }
    }


    if (req.body.toDate && req.body.fromDate) {
        dbQuery.createdAt = { $gte: new Date(req.body.fromDate), $lt: new Date(req.body.toDate) }
    }
    try {
        if (req.body.activity === "sports") {
            pages = await other.BetCollection.find(dbQuery).countDocuments()
            data = await other.BetCollection.find(dbQuery).limit(query.limit).skip(query.skip)
        }
        if (req.body.activity === "withdraw") {
            pages = await other.UserWithdrawls.find(dbQuery).countDocuments()
            data = await other.UserWithdrawls.find(dbQuery).limit(query.limit).skip(query.skip)
        }

        if (req.body.activity === "deposit") {
            pages = await other.UserDeposits.find(dbQuery).countDocuments()
            data = await other.UserDeposits.find(dbQuery).limit(query.limit).skip(query.skip)
        }
        return   res.status(200).send({
            status: 200,
            message: "Success",
            Data:data,
            totalPages: Math.ceil(pages / query.limit),
            currentPage: parseInt(query.page)
        })
    } catch (err) {
        res.status(500).send({
            status: 500,
            message: "Due to technical issues something went wrong.Try again"
        })
    }


}
module.exports = {
    authenticate,
    getAll,
    getById,
    searchUser,
    searchManager,
    createUser,
    updateUser,
    removeUser,
    forgotPassword,
    getAllManagers,
    updateManagerName,
    updateManagerEmail,
    verifyEmail,
    createReferralById,
    resetPassword,
    verifyResetToken,
    blockUser,
    getBlockedUsers,
    unblockUser,
    getRefferedUsers,
    logout,
    getByManagerId,
    UpdateUserByID,
    BalanceDeductByID,
    BalanceTransferByID,
    approveUserDepositRequest,
    approveUserWithdrawRequest,
    getUserDepositRequestById,
    getUserWithdrawlRequestsById,
    userActivityController
}