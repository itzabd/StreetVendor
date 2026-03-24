const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/applicationController');

// Vendor: submit application
router.post('/', authenticate, ctrl.create);
// Both: view applications
router.get('/', authenticate, ctrl.getAll);
// Admin: update status
router.put('/:id', authenticate, requireAdmin, ctrl.updateStatus);

module.exports = router;
