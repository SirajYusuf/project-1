const bankDetails = require('../models/bank_details')
const User = require('../models/admin-users')
const other = require('../config/mongooseOther')
const { searchUtility, paginationUtility, sortingUtiliy,dateUtility } = require('../utilities/commonQueryUtils')
const conn = require('../config/transactionConfig')
var ObjectId = require('mongodb').ObjectId;
// const { find, findOne } = require('../models/bank_details');
const BankDetails=require('../models/bankDetails');
const AWS = require('aws-sdk');
const config=require('../config.json');



const updateBankDetails=async(req,res)=>{

    try{
 
        const file = req.file;
    
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/))
        {
            res.status(400).send({
                status:400,
                Message:"Only JPG,JPEG,PNG files only allowed to upload"
            })
        }

        else{ 
  
            //Configurations for the s3-bucket
          const s3 = new AWS.S3({
        accessKeyId:  config.ACCESS_KEY_ID,
        secretAccessKey: config.SECRET_ACCESS_KEY
        });
    
        const imageType=req.body.imageType;

        const params={
            Bucket: config.BUCKET,
            Key: req.id+'/Images'+'/bank_details/'+Date.now()+req.file.originalname,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
            ACL:'public-read'
             };

             s3.upload(params, async function(s3Err, data) {
         
                if (s3Err) {
       
                   return res.status(400).send({
                       status:400,
                       Message:"Unable to update details.Try again"
                   })
                }
                else{

                    const body={...req.body,logoURL:data.Location};

                    await BankDetails.findOneAndUpdate({_id:req.body._id},{$set:body},{new:true}).then(result=>{
               
                       return res.status(200).send({
               
                           status:200,
                           Message:"Bank Details updated successfully",
                           Data:result
                       })
                   
                  
                })
            }
        })
                   
    }

    
   }
   catch(err)
   {
       res.status(500).send({
           status:500,
           Message:err.message ||"Due to technical issues something went wrong.Try again"
       })
   }

}

const getBankDetails=async(req,res)=>{
    try{

     

      await BankDetails.find({}).then(data=>{

       

            return res.status(200).send({

                status:200,
                Message:"Fetched successfully",
                Data:data
            })
        
      }) 
    }
    catch(err)
    {
        res.status(500).send({

            status:500,
            Message:err.message || "Due to technical issues something went wrong.Try again"
        })
    }
}

const fetchManagers = async(req,res) => {
    await User.find({role: "operationmanager"}).select('username').then((data) => {
        res.status(200).send({
            status: 200,
            message: "success",
            Data: data
        })
    }).catch((e) => {
        res.status(500).send({
            status: 500,
            message: "Due to technical issues something went wrong.Try again"
        })
    })
}

//transfer funds to all operation manager
const transferFunds = async(req,res) =>{
    const session = await conn.startSession()
    session.startTransaction()
    try{
        let deductBal
        let findQuery = {}
        if(req.body.allManagers === true){
            const managersCount = await User.countDocuments({role: "operationmanager"}).session(session)
            findQuery = {role:'operationmanager'}
            deductBal = parseFloat(req.user.walletBalance) - parseFloat(req.body.walletBalance)*managersCount
        }else{
            await User.findOne({_id:req.body._id}).session(session)
            findQuery = {_id:req.body.id}
            deductBal = parseFloat(req.user.walletBalance) - parseFloat(req.body.walletBalance)
        }
        if(deductBal >= 0){
            await User.findOneAndUpdate({_id:req.id},{$set:{walletBalance: deductBal}},{new:true}).session(session)
            const addBal = parseFloat(req.body.walletBalance)
            await User.updateMany(findQuery,{$inc:{walletBalance: addBal}},{new:true}).session(session).then((data)=>{
                res.status(200).send({
                    satus: 200,
                    message: "Transfer was successfull"
                })
            }).catch(async(e)=>{
                await session.abortTransaction()
                res.status(400).send({
                    status: 400,
                    message: "Due to technical issues something went wrong.Try again"
                })
            })
        }else{
            res.status(400).send({
            status: 400,
            message: "Your request could not be processed because of insufficient wallet ballance!"
            })
        }
        await session.commitTransaction()
    }catch(e){
        await session.abortTransaction()
        res.status(500).send({
            status: 500,
            message: "Due to technical issues something went wrong.Try again"
        })
    }
}

const totalManagers = async(req,res) => {
    await User.countDocuments({role: "operationmanager"}).then((data)=> {
        res.status(200).send({
            status: 200,
            message: "success",
            Data: data   
        })
    }).catch((e)=> {
        console.log(e)
        res.status(500).send({
            status: 500,
            message: "Due to technical issues something went wrong.Try again"
        })
    })
}

//sort by last updated
const lastTransfer = async(req,res) => {
    await User.find({}).sort('-updatedat').then((data)=> {
        res.status(200).send({
            status: 200,
            message: "success",
            Data: data
        })
    }).catch((e) => {
        res.status(500).send({
            status: 500,
            message: "Due to technical issues something went wrong.Try again"
        })
    })
}

const getUserWithdrawls = async (req, res) => {
    try {
        const searchText = req.body.searchText;
        const dateQuery = await dateUtility(req,res)
        const query = await paginationUtility(req, res)
        console.log(query)
        const sorting = await sortingUtiliy(req, res)
        const documents = await other.UserWithdrawls.find({}).countDocuments()
        var aggregation = [
            { $match: dateQuery },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userData'
                }
            },
            { "$match": { "userData.userName": { "$in": [new RegExp(searchText)] } } },
            {
                $unwind: '$userData'
            },

            {
                $lookup: {
                    from: 'referralcodes',
                    localField: 'userData.referralCode',
                    foreignField: 'referralCode',
                    as: 'refData'
                }
            },
            {
                $unwind: '$refData'
            },

            {
                $addFields: {
                    userName:'$userData.userName',
                    managerName: '$refData.managerName',
                    managerId: '$refData.managerId',
                    userRegisteredBankName: '$userData.bankName',
                    userRegisteredAccountHolderName: '$userData.accountHolderName',
                    userRegisteredAccountNumber: '$userData.bankNumber'

                }
            },
            {

                $project: {
                    _id: 1,
                    documents:1,
                    userName:1,
                    transactionId: 1,
                    transactionTime: 1,
                    transactionStatus: 1,
                    amount: 1,
                    accountHolderName: 1,
                    mobileNumber: 1,
                    swiftCode: 1,
                    transactiontype: 1,
                    email: 1,
                    userId: 1,
                    depositImage: 1,
                    bankNumber: 1,
                    transactionTypeImage: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    settledBy: 1,
                    createdBy: 1,
                    managerName: 1,
                    managerId: 1,
                    userRegisteredBankName: 1,
                    userRegisteredAccountHolderName: 1,
                    userRegisteredAccountNumber: 1,
                }
            },
          ]
        var aggregationPaginated = aggregation.slice(0);
        aggregation.push({
              $group: {
                _id: null,
                count: { $sum: 1 }
              }
            });
        // Sort in pagination query.
        aggregationPaginated.push({
              $sort: sorting
        });
        aggregationPaginated.push({
              $limit: query.skip + query.limit
            },
            {
              $skip: query.skip
            })
       const data = await other.UserWithdrawls.aggregate(aggregation)
       if (data == 0) {
        return res.status(200).send({
            status: 200,
            message: "No users found",
            Data: data,
            totalPages: Math.ceil(data.length/query.limit),
            currentPage: parseInt(query.page),
            filteredDocuments: data.length,
            NumberOfDocuments:documents
        })
       }
        else {
            var numFiltered = data[0].count;
            await other.UserWithdrawls.aggregate(aggregationPaginated).then((data) =>{
            if (data == 0) {
                return res.status(200).send({
                    status: 200,
                    message: "No users found",
                    Data: data,
                    totalPages: Math.ceil(data.length/query.limit),
                    currentPage: parseInt(query.page),
                    filteredDocuments: data.length,
                    NumberOfDocuments:documents
                })
            }
            else {
            return res.status(200).send({
                status: 200,
                message: "Success",
                Data: data,
                totalPages: Math.ceil(numFiltered/query.limit),
                currentPage: parseInt(query.page),
                filteredDocuments: numFiltered,
                NumberOfDocuments:documents
            });
            }
         });
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

const getUserDeposits = async (req, res) => {
    try {
        const searchText = req.body.searchText;
        const dateQuery = await dateUtility(req,res)
        const query = await paginationUtility(req, res)
        console.log(query)
        const sorting = await sortingUtiliy(req, res)
        const documents = await other.UserDeposits.find({}).countDocuments()
        var aggregation = [
            { $match: dateQuery},
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userData'
                }
            },
            { "$match": { "userData.userName": { "$in": [new RegExp(searchText)] } } },
            {
                $unwind: '$userData'
            },

            {
                $lookup: {
                    from: 'referralcodes',
                    localField: 'userData.referralCode',
                    foreignField: 'referralCode',
                    as: 'refData'
                }
            },
            {
                $unwind: '$refData'
            },

            {
                $addFields: {
                    userName:'$userData.userName',
                    managerName: '$refData.managerName',
                    managerId: '$refData.managerId',
                    userRegisteredBankName: '$userData.bankName',
                    userRegisteredAccountHolderName: '$userData.accountHolderName',
                    userRegisteredAccountNumber: '$userData.bankNumber'

                }
            },
            {

                $project: {
                    _id: 1,
                    documents:1,
                    userName:1,
                    transactionId: 1,
                    transactionTime: 1,
                    transactionStatus: 1,
                    amount: 1,
                    accountHolderName: 1,
                    mobileNumber: 1,
                    swiftCode: 1,
                    transactiontype: 1,
                    email: 1,
                    userId: 1,
                    depositImage: 1,
                    bankNumber: 1,
                    transactionTypeImage: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    settledBy: 1,
                    createdBy: 1,
                    managerName: 1,
                    managerId: 1,
                    userRegisteredBankName: 1,
                    userRegisteredAccountHolderName: 1,
                    userRegisteredAccountNumber: 1,
                }
            },
          ]
        var aggregationPaginated = aggregation.slice(0);
        aggregation.push({
              $group: {
                _id: null,
                count: { $sum: 1 }
              }
            });
        // Sort in pagination query.
        aggregationPaginated.push({
              $sort: sorting
        });
        aggregationPaginated.push({
              $limit: query.skip + query.limit
            },
            {
              $skip: query.skip
            })
       const data = await other.UserDeposits.aggregate(aggregation)
       if (data == 0) {
        return res.status(200).send({
            status: 200,
            message: "No users found",
            Data: data,
            totalPages: Math.ceil(data.length/query.limit),
            currentPage: parseInt(query.page),
            filteredDocuments: data.length,
            NumberOfDocuments:documents
        })
       }
        else {
            var numFiltered = data[0].count;
            await other.UserDeposits.aggregate(aggregationPaginated).then((data) =>{
            if (data == 0) {
                return res.status(200).send({
                    status: 200,
                    message: "No users found",
                    Data: data,
                    totalPages: Math.ceil(data.length/query.limit),
                    currentPage: parseInt(query.page),
                    filteredDocuments: data.length,
                    NumberOfDocuments:documents
                })
            }
            else {
            return res.status(200).send({
                status: 200,
                message: "Success",
                Data: data,
                totalPages: Math.ceil(numFiltered/query.limit),
                currentPage: parseInt(query.page),
                filteredDocuments: numFiltered,
                NumberOfDocuments:documents
            });
            }
         });
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

const changeAdminBankStatus=async(req,res)=>{
    try{

    

    const data=await BankDetails.findOneAndUpdate({_id:req.body._id},{$set:{isActive:req.body.isActive}},{upsert:true,new:true})
    if(data)
    {
        return res.status(200).send({
            status:200,
            Message:"Status changed successfully",
            Data:data
        })
    }

}
catch(err)

{
    res.status(500).send({
        status:500,
        Message:err.message || "Due to technical issues something went wrong.Try again"
    })
}
}

module.exports = {
    updateBankDetails,
    getUserWithdrawls,
    getUserDeposits,
    transferFunds,
    totalManagers,
    lastTransfer,
    fetchManagers,
    getBankDetails,
    changeAdminBankStatus
}