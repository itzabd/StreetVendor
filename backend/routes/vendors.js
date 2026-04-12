const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/vendorController');

router.get('/profile', authenticate, ctrl.getProfile);
router.put('/profile', authenticate, ctrl.updateProfile);

// Admin routes for vendor management
// (using authenticates middleware, normally should verify admin role)
router.get('/all', authenticate, ctrl.getAllVendors);
router.put('/admin/:id', authenticate, ctrl.adminUpdateVendor);

module.exports = router;
