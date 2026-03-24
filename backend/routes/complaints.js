const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/complaintController');

// Vendor: submit. Admin: view all
router.post('/', authenticate, ctrl.create);
router.get('/', authenticate, ctrl.getAll);
router.put('/:id', authenticate, requireAdmin, ctrl.updateStatus);

module.exports = router;
