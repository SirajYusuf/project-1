const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');

const router = new express.Router();
const authorize = require('../utilities/authorize');

router.get('/getDashboard',authorize.verifyToken, authorize.isSuperAdmin,dashboardController.getDashboard);

module.exports = router;    