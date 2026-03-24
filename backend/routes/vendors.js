const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/vendorController');

router.get('/profile', authenticate, ctrl.getProfile);
router.put('/profile', authenticate, ctrl.updateProfile);

module.exports = router;
