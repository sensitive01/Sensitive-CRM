const express = require('express');
const router = express.Router(); 
const verificationControllers = require("../controllers/verificationControllers");

// Employee login
router.post('/login', verificationControllers.employeeLogin);

// Superadmin login
router.post('/adminlogin', verificationControllers.superadminLogin);

// Change password (for both roles)
router.put('/change-password', verificationControllers.changePassword);

module.exports = router;
