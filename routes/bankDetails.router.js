const express = require('express');
const BankController = require('../controllers/bankDetails.controller');
const router = new express.Router();



const multer = require("multer");

const storage = multer.memoryStorage({
    destination: function (req, file, cb) {
        cb(null, '')
    }
})

const upload = multer({ storage: storage }).single('file');

const authorize = require('../utilities/authorize');


router.post('/updateBankDetails', authorize.verifyToken, authorize.isSuperAdmin,upload,BankController.updateBankDetails); 

router.get('/getBankDetails',authorize.verifyToken, authorize.isSuperAdmin,BankController.getBankDetails);
// router.post('/uploadBankLogo',authorize.verifyToken, authorize.isSuperAdmin,upload, BankController.updateBankLogo)

router.get('/fetchManagers', authorize.verifyToken, authorize.isSuperAdmin, BankController.fetchManagers)

router.post('/transferFunds', authorize.verifyToken, authorize.isSuperAdmin, BankController.transferFunds)

router.post('/getUserWithdrawls', authorize.verifyToken, authorize.isOperationManagerOrSuperAdmin, BankController.getUserWithdrawls)

router.post('/getUserDeposits', authorize.verifyToken, authorize.isOperationManagerOrSuperAdmin, BankController.getUserDeposits)


router.get('/totalManagers', authorize.verifyToken, authorize.isSuperAdmin, BankController.totalManagers)

router.get('/lastTransfer', authorize.verifyToken, authorize.isSuperAdmin, BankController.lastTransfer)

router.put('/changeAdminBankDetails',authorize.verifyToken, authorize.isSuperAdmin, BankController.changeAdminBankStatus);

module.exports = router;    