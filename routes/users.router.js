const express = require('express');
const userController = require('../controllers/users.controller');
const reportsController=require('../controllers/reports.controller');
const router = new express.Router();
const authorize = require('../utilities/authorize');
const role = require('../utilities/role');


router.post('/users', authorize.verifyToken, authorize.isMarketingManagerOrSuperAdmin, userController.getAll); // admin only

router.post('/searchUser', authorize.verifyToken, authorize.isMarketingManagerOrSuperAdmin, userController.searchUser)

router.post('/searchManager', authorize.verifyToken, authorize.isSuperAdmin, userController.searchManager)

router.get('/users/:id', authorize.verifyToken, authorize.isMarketingManagerOrSuperAdmin, userController.getById);  // all authenticated users

router.get('/delete/:id', authorize.verifyToken, authorize.isMarketingManagerOrSuperAdmin, userController.removeUser); 
 // all authenticated users
router.put('/users/:id', authorize.verifyToken, authorize.isMarketingManagerOrSuperAdmin, userController.UpdateUserByID); 

router.put('/balanceDeduct/:id', authorize.verifyToken, authorize.isSuperAdmin, userController.BalanceDeductByID); 

router.put('/balanceTranfer/:id', authorize.verifyToken, authorize.isSuperAdmin, userController.BalanceTransferByID); 

router.post('/createManagers', authorize.verifyToken, authorize.isSuperAdmin, userController.createUser);

router.post('/updateManagerName', authorize.verifyToken, authorize.isSuperAdmin, userController.updateManagerName);

router.post('/updateManagerEmail', authorize.verifyToken, authorize.isSuperAdmin, userController.updateManagerEmail);

router.post('/updateManagerPassword', authorize.verifyToken, authorize.isSuperAdmin, userController.resetPassword);

router.post('/managers', authorize.verifyToken, authorize.isSuperAdmin, userController.getAllManagers);

router.get('/managers/:id', authorize.verifyToken, authorize.isSuperAdmin, userController.getByManagerId);

router.post('/createAdmin', userController.createUser);

router.post('/login', userController.authenticate);

router.post('/forgotPassword', userController.forgotPassword)

router.post('/resetPassword', userController.verifyResetToken);

router.post('/verifyEmail', userController.verifyEmail);

router.post('/createReferralById', authorize.verifyToken, authorize.isSuperAdmin, userController.createReferralById)

router.post('/blockUser', authorize.verifyToken, authorize.isMarketingManagerOrSuperAdmin, userController.blockUser);

router.post('/getBlockedUsers', authorize.verifyToken, authorize.isMarketingManagerOrSuperAdmin, userController.getBlockedUsers);

router.post('/unblockUser', authorize.verifyToken, authorize.isMarketingManagerOrSuperAdmin, userController.unblockUser);

router.get('/getReferredUsers', authorize.verifyToken, authorize.isMarketingManager, userController.getRefferedUsers);

router.post('/approveDepositRequests',authorize.verifyToken,authorize.isSuperAdmin,userController.approveUserDepositRequest);

router.post('/approveUserWithdrawRequest',authorize.verifyToken,authorize.isSuperAdmin,userController.approveUserWithdrawRequest);

router.post('/getUserDepositsRequestsById',authorize.verifyToken,authorize.isSuperAdmin,userController.getUserDepositRequestById);

router.post('/getUserWithdrawlsRequestsById',authorize.verifyToken,authorize.isSuperAdmin,userController.getUserWithdrawlRequestsById);

router.post('/userActivityRecords',authorize.verifyToken, authorize.isMarketingManagerOrSuperAdmin,userController.userActivityController);

router.post('/getUserReports',authorize.verifyToken,authorize.isSuperAdmin,reportsController.userReports);

router.get('/viewReport/:id', authorize.verifyToken, authorize.isSuperAdmin, reportsController.report);

router.post('/deleteReport',authorize.verifyToken,authorize.isSuperAdmin,reportsController.deleteReport);

router.post('/logout', authorize.verifyToken, userController.logout);

module.exports = router;

