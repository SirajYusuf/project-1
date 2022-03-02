const mongoose=require('mongoose');
Schema = mongoose.Schema;
const Admin=require('./admin-users');

const bankDetailSchema=new mongoose.Schema({

    logoURL:{
        type:String
    },
    title:{
        type:String
    },
    bankName:{
        type:String
    },
    accountHolderName:{
        type:String
    },
    accountNumber:{
        type:String
    },
    swiftCode:{
        type:String
    },
    minimumAmountOfDeposit:{
        type:Number
    },
    minimumAmountOfWithdraw:{

        type:Number
    },
    maximumAmountOfDeposit:{
        type:Number
    },
    maximumAmountOfWithdraw:{
        type:Number
    },
    createdBy:{
        type:Schema.Types.ObjectId,
        ref:'Admin'
    },
    isActive:{
        type:Boolean,
        default:true
    }
},{timestamps:true,versionKey:false});

const BankDetails=new mongoose.model('admin_bank_details',bankDetailSchema);

module.exports=BankDetails;