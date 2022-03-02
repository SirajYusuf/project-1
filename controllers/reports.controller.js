const {UserReports,UserCollection}=require('../config/mongooseOther');
const {paginationUtility, sortingUtiliy,dateUtility } = require('../utilities/commonQueryUtils')
var ObjectId = require('mongodb').ObjectId;

const userReports=async(req,res)=>{
    try {
        const searchText = req.body.searchText;
        const dateQuery = await dateUtility(req,res)
        const query = await paginationUtility(req, res)
        const sorting = await sortingUtiliy(req, res)
        const documents = await UserReports.find({}).countDocuments()
        var aggregation = [
            { $match: dateQuery },
            {
                $lookup:{
                    from:"users",
                    localField:"userId",
                    foreignField:"_id",
                    as:"userData"
                }
            },
            { "$match": { "userData.userName": { "$in": [new RegExp(searchText)] } } },
            {
                $unwind:'$userData'

            },
            {
                $lookup:{
                    from:'referralcodes',
                    localField:'userData.referralCode',
                    foreignField:'referralCode',
                    as:'refData'
                }
            },
            {
                $unwind:'$refData'
            },
         
            {
                $addFields:{
                    userName:'$userData.userName',
                    managerName:'$refData.managerName',
                    managerId:'$refData.managerId',
                    userId:'$userData._id'
            

                }
            },
            {
                $project:{
                    userName:1,
                    _id:1,
                    managerName:1,
                    managerId:1,
                    userId:1,
                    description:1,
                    createdAt:1
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
       const data = await UserReports.aggregate(aggregation)
       if (data == 0) {
        return res.status(200).send({
            status: 200,
            message: "No users found",
            Data: data,
            totalPages: Math.ceil(data.length/query.limit),
            currentPage: parseInt(query.page),
            filteredDocuments: data.length,
            documents:documents
        })
       }
        else {
            var numFiltered = data[0].count;
            await UserReports.aggregate(aggregationPaginated).then((data) =>{
            if (data == 0) {
                return res.status(200).send({
                    status: 200,
                    message: "No users found",
                    Data: data,
                    totalPages: Math.ceil(data.length/query.limit),
                    currentPage: parseInt(query.page),
                    filteredDocuments: data.length,
                    documents:documents
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
                documents:documents
            });
            }
         });
        }
    }
    catch(err)
    {
        console.log(err)
        res.status(500).send({
            status:500,
            Message:"Due to technical issues something went wrong.Try again"
        })
    }

}

const report = async(req,res)=>{
    try {
        const objId = req.params.id
        var aggregation = [
            {
                $lookup:{
                    from:"users",
                    localField:"userId",
                    foreignField:"_id",
                    as:"userData"
                }
            },
            { 
            $match: {
                '_id':ObjectId(objId)
            } 
            },
            {
                $unwind:'$userData'

            },
            {
                $lookup:{
                    from:'referralcodes',
                    localField:'userData.referralCode',
                    foreignField:'referralCode',
                    as:'refData'
                }
            },
            {
                $unwind:'$refData'
            },
         
            {
                $addFields:{
                    userName:'$userData.userName',
                    managerName:'$refData.managerName',
                    managerId:'$refData.managerId',
                    userId:'$userData._id'
            

                }
            },
            {
                $project:{
                    userName:1,
                    _id:1,
                    managerName:1,
                    managerId:1,
                    userId:1,
                    description:1,
                    createdAt:1
                }
            }
        ]
        const data =await UserReports.aggregate(aggregation)
        return res.status(200).send({
            status: 200,
            message: 'success',
            Data: data
        })
    } catch (e) {
        console.log("error:", e)
        res.status(500).send({
            status: 500,
            message: "Due to technical issues something went wrong.Try again "
        })
    }
}

const deleteReport = async(req,res)=>{
    console.log(req.body.id)
 try{ 
     await UserReports.findOneAndDelete({_id:req.body.id}).then((data)=>{
        if(data){
            res.status(200).send({
                status: 200,
                message: "Report deleted successfully"
            })
        }else{
            res.status(400).send({
                status: 400,
                message: "unable to delete this report!"
            })
        }
    })
}catch(e){
    console.log(e)
    res.status(500).send({
        status: 500,
        message: "Due to technical issues something went wrong.Try again " 
    })
}
}

module.exports={
    userReports,
    report,
    deleteReport
}