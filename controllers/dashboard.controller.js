const Other=require('../config/mongooseOther');
const User = require('../models/admin-users')

const getDashboard=async(req,res)=>{
    try{
      
        const usersCount=await Other.UserCollection.find({statusId:{$ne:0}}).countDocuments();
        const blockedUsersCount=await Other.UserCollection.find({statusId:4}).countDocuments();
        const managers = await User.find({$or:[{role:'marketingmanager'},{role:'operationmanager'}]}).countDocuments()
        var d = new Date();
        d.setMonth(d.getMonth() - 1);
        const activeManagers = await User.find({
                $and:[{
                    $or: [{ role: 'operationmanager' }, { role: 'marketingmanager' }] },
                    {lastLogin:{$gte:d}}
            ]}).countDocuments()
        const inactiveManagers = await User.find({
                $and:[{
                    $or: [{ role: 'operationmanager' }, { role: 'marketingmanager' }] },
                    {lastLogin:{$lte:d}}
            ]}).countDocuments()
        var w = new Date();
        w.setDate(w.getDate() - 7)
        const newManagers = await User.find({
            $and:[{
                $or: [{ role: 'operationmanager' }, { role: 'marketingmanager' }] },
                {createdAt:{$gte:w}}
        ]}).countDocuments()
        
        const results =await Other.BetCollection.aggregate([
            {
              '$group': {
                '_id': '$sportName', 
                'count': {
                  '$sum': 1
                }
              }
            }
          ])

          const bets=await Other.BetCollection.find({});
          const betAmountSum=bets.map(Bets=>Bets.betAmount).reduce((prev,curr)=>prev+curr);
        
  
          const winnersCount=await Other.BetCollection.find({betStatus:3}).countDocuments();
          const losersCount=await Other.BetCollection.find({betStatus:4}).countDocuments();

        return res.status(200).send({
            status:200,
            Message:"Successfully fetched",
            Data:{
                usersCount:usersCount,
                blockedUsersCount:blockedUsersCount,
                activeUsersCount:9,
                inactiveUsersCount:1,
                totalManagers:managers,
                activeManagers,
                inactiveManagers,
                newManagers,
                totalBets:bets.length,
                totalWinningBets:winnersCount,
                totalLostBets:losersCount,
                sports:results
            }
        })
      
    }
    catch(err)
    {
        console.log(err)
       res.status(500).send({
           status:500,
           Message:'Due to technical issues something went wrong.Try agin'
       })
    }
}

module.exports={
    getDashboard
};