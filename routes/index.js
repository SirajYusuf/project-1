const express = require('express');
const router = new express.Router();
const userRouter = require('./users.router')
const bankDetailsRouter = require('./bankDetails.router');
const dashboardRouter=require('./dashboard')
const baseURL = '/betmaster/superadmin/api';


router.use(baseURL, userRouter);

router.use(baseURL, bankDetailsRouter);

router.use(baseURL,dashboardRouter);




router.get('/', (req, res) => {
    res.status(200).json({
        message: 'Betmaster super admin deployed successfully'
    })

})

router.use('*', (req, res) => {
    res.status(404).json({
        message: 'url_not_found'
    })
})

module.exports = router;
